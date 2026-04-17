---
phase: 19-application-configuration
plan: 01
subsystem: infra
tags: [quarkus, postgresql, railway, configuration, environment-variables]

# Dependency graph
requires:
  - phase: 18-db-ownership-fresh-v1-baselines
    provides: Clean per-service Flyway V1 baselines; flyway.migrate-at-start=true set; no shared DB vestiges
provides:
  - identity-service application.properties with externalized datasource URL and HTTP port
  - catalog-service application.properties with externalized datasource URL and HTTP port
  - Both services enforce explicit prod failure when QUARKUS_DATASOURCE_JDBC_URL is absent
affects: [20-dockerfile-fixes-railway-deployment, 21-local-dev-docker-compose]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quarkus env var ordinal 300: absence of base quarkus.datasource.jdbc.url forces hard failure in prod if QUARKUS_DATASOURCE_JDBC_URL unset"
    - "%dev profile fallback for jdbc.url points to per-service localhost containers; no collision with prod env var"
    - "${PORT:808x} syntax for HTTP port externalization with safe fallback"

key-files:
  created: []
  modified:
    - anotame-api/backend/identity-service/src/main/resources/application.properties
    - anotame-api/backend/catalog-service/src/main/resources/application.properties

key-decisions:
  - "No base quarkus.datasource.jdbc.url= line: prod must fail explicitly if QUARKUS_DATASOURCE_JDBC_URL is unset (silent fallback to wrong host eliminated)"
  - "identity-service %dev fallback: localhost:5431/identity (Phase 21 must provision this container)"
  - "catalog-service %dev fallback: localhost:5432/catalog (Phase 21 must provision this container)"

patterns-established:
  - "Pattern: externalize datasource URL via env var ordinal 300 + %dev fallback — apply same pattern to sales-service and operations-service in Phase 20"

requirements-completed: [CFG-01, CFG-02, CFG-03]

# Metrics
duration: 4min
completed: 2026-04-16
---

# Phase 19 Plan 01: Application Configuration Summary

**Externalized datasource URL and HTTP port for identity-service and catalog-service via Quarkus env var ordinal 300 pattern, with %dev localhost fallbacks and explicit prod failure on missing QUARKUS_DATASOURCE_JDBC_URL**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-16T17:01:00Z
- **Completed:** 2026-04-16T17:05:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Removed hardcoded `quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame` from both identity-service and catalog-service
- Added `%dev.quarkus.datasource.jdbc.url` fallbacks pointing to per-service local containers (localhost:5431/identity, localhost:5432/catalog)
- Externalized HTTP port binding via `${PORT:8081}` / `${PORT:8082}` — Railway's PORT assignment now honored at runtime
- Phase 18 properties (flyway.migrate-at-start) left untouched; boundary respected

## Task Commits

Each task was committed atomically:

1. **Task 1: Externalize identity-service datasource URL and HTTP port** - `7d2ff7b` (feat)
2. **Task 2: Externalize catalog-service datasource URL and HTTP port** - `3883ee0` (feat)

**Plan metadata:** (see final docs commit)

## Files Created/Modified

- `anotame-api/backend/identity-service/src/main/resources/application.properties` - Removed hardcoded anotame-db URL; added %dev fallback to localhost:5431/identity; port externalized to ${PORT:8081}
- `anotame-api/backend/catalog-service/src/main/resources/application.properties` - Removed hardcoded anotame-db URL and obsolete Docker comment; added %dev fallback to localhost:5432/catalog; port externalized to ${PORT:8082}

## Decisions Made

- No base `quarkus.datasource.jdbc.url=` line left in either file: if Railway does not inject QUARKUS_DATASOURCE_JDBC_URL, the service fails immediately rather than silently connecting to a wrong or unreachable host — explicit failure is the desired behavior
- %dev fallback ports match the per-service PostgreSQL container port assignments that Phase 21 must provision (identity on 5431, catalog on 5432)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required by this plan. Railway must have QUARKUS_DATASOURCE_JDBC_URL, QUARKUS_DATASOURCE_USERNAME, QUARKUS_DATASOURCE_PASSWORD, and PORT set per service for prod deploys — this is handled in Phase 20 (Dockerfile + Railway deployment configuration).

## Next Phase Readiness

- Phase 20 (Dockerfile Fixes + Railway Deployment): Both services now correctly externalized — Railway env var injection will work without a base URL override conflict
- Phase 21 (Local Dev Docker Compose): %dev fallback ports are set; Phase 21 must provision PostgreSQL containers at localhost:5431 (identity) and localhost:5432 (catalog)
- sales-service and operations-service: Not in scope for this plan — Phase 20 should apply the same externalization pattern to those two services

---
*Phase: 19-application-configuration*
*Completed: 2026-04-16*
