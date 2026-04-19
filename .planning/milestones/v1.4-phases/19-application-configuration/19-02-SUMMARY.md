---
phase: 19-application-configuration
plan: "02"
subsystem: backend-config
tags: [configuration, externalization, quarkus, railway, sales-service, operations-service]
dependency_graph:
  requires: [19-01]
  provides: [CFG-01-sales, CFG-02-sales, CFG-03-sales, CFG-01-operations, CFG-02-operations, CFG-03-operations]
  affects: [anotame-api/backend/sales-service, anotame-api/backend/operations-service]
tech_stack:
  added: []
  patterns: [quarkus-profile-config, env-var-externalization, dev-profile-fallback]
key_files:
  created: []
  modified:
    - anotame-api/backend/sales-service/src/main/resources/application.properties
    - anotame-api/backend/operations-service/src/main/resources/application.properties
decisions:
  - No base quarkus.datasource.jdbc.url retained in either file — prod fails visibly if QUARKUS_DATASOURCE_JDBC_URL is absent
  - %dev profile fallbacks use per-service local ports (5433/sales, 5434/operations) matching Phase 21 Docker Compose targets
metrics:
  duration: "~3 minutes"
  completed: "2026-04-16"
  tasks: 2
  files: 2
---

# Phase 19 Plan 02: Sales-Service and Operations-Service Configuration Externalization Summary

**One-liner:** Removed hardcoded `anotame-db` JDBC URLs and bare HTTP ports from sales-service and operations-service; replaced with env-var-driven production config and `%dev` profile fallbacks to per-service local DB ports.

## What Was Done

Completed CFG-01, CFG-02, and CFG-03 for the remaining two services (sales-service and operations-service), mirroring the pattern established in Plan 01 for identity-service and catalog-service.

### Task 1: sales-service
- Replaced `quarkus.http.port=8083` with `quarkus.http.port=${PORT:8083}`
- Removed `quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame`
- Added `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5433/sales` with production comments
- Commit: `1bc842f`

### Task 2: operations-service
- Replaced `quarkus.http.port=8084` with `quarkus.http.port=${PORT:8084}`
- Removed obsolete comment "Use 'anotame-db' for Docker, 'localhost' for local dev..." and hardcoded URL
- Added `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5434/operations` with production comments
- Commit: `0226c18`

## Cross-Phase Audit Results (All 4 Services)

All 6 verification checks passed after both tasks:

| Check | Expected | Result |
|-------|----------|--------|
| No `anotame-db` in any service | 0 matches | PASS |
| No bare `quarkus.http.port=[0-9]` | 0 matches | PASS |
| `%dev.quarkus.datasource.jdbc.url` in all 4 services | 4 matches | PASS |
| No base `quarkus.datasource.jdbc.url=` in any service | 0 matches | PASS |
| No plain-text credentials | 0 matches | PASS |
| Port assignments: 8081/8082/8083/8084 via `${PORT:...}` | 4 matches | PASS |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `1bc842f` | feat(19-02): externalize sales-service datasource URL and HTTP port |
| Task 2 | `0226c18` | feat(19-02): externalize operations-service datasource URL and HTTP port |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. Both `T-19-05` (sales-service jdbc.url disclosure) and `T-19-06` (operations-service jdbc.url disclosure) from the plan's threat register have been mitigated: no prod-reachable host string remains committed to VCS. `T-19-08` (hardcoded HTTP port DoS) mitigated by `${PORT:...}` expressions on both services.

## Self-Check: PASSED

- `anotame-api/backend/sales-service/src/main/resources/application.properties` — verified correct
- `anotame-api/backend/operations-service/src/main/resources/application.properties` — verified correct
- Commit `1bc842f` — verified in git log
- Commit `0226c18` — verified in git log
