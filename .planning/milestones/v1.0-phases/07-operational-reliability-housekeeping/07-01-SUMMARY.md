---
phase: 07-operational-reliability-housekeeping
plan: "01"
subsystem: backend
tags: [health-checks, quarkus, pom, operational-reliability]
dependency_graph:
  requires: []
  provides: [quarkus-smallrye-health on all 4 services]
  affects: [docker-compose health checks (Plan 02), Railway readiness probes]
tech_stack:
  added: [quarkus-smallrye-health (BOM-managed, no explicit version)]
  patterns: [Quarkus SmallRye Health — Agroal auto-registered DB readiness probe]
key_files:
  created: []
  modified:
    - anotame-api/backend/identity-service/pom.xml
    - anotame-api/backend/catalog-service/pom.xml
    - anotame-api/backend/sales-service/pom.xml
    - anotame-api/backend/operations-service/pom.xml
decisions:
  - quarkus-smallrye-health added to all 4 services with no explicit version; quarkus-bom 3.27.2 manages the version to avoid drift
  - operations-service does not receive quarkus-smallrye-jwt — confirmed absent before and after edit
metrics:
  duration: 48s
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_modified: 4
---

# Phase 07 Plan 01: Add quarkus-smallrye-health to All Backend Services Summary

**One-liner:** Added quarkus-smallrye-health extension (BOM-managed, no version tag) to all 4 Quarkus services, enabling automatic /q/health/ready, /q/health/live, and /q/health endpoints with Agroal DB readiness probe.

## What Was Built

All 4 backend services (identity-service, catalog-service, sales-service, operations-service) now have the `quarkus-smallrye-health` extension in their `pom.xml` dependency blocks. No custom Java code was written — the extension auto-registers an Agroal datasource readiness check when `quarkus-jdbc-postgresql` is also present.

The dependency was inserted after the last existing `quarkus-*` entry in each file, before any non-Quarkus dependencies (lombok), consistent with the existing ordering convention.

## Tasks Completed

| Task | Description | Commit | Files Modified |
|------|-------------|--------|----------------|
| 1 | Add health extension to identity-service and catalog-service | 014d441 | identity-service/pom.xml, catalog-service/pom.xml |
| 2 | Add health extension to sales-service and operations-service | 3c26bfa | sales-service/pom.xml, operations-service/pom.xml |

## Verification Results

All 4 services confirmed:
- `quarkus-smallrye-health` artifactId present in each pom.xml
- No explicit `<version>` tag on the new dependency (BOM-managed)
- `quarkus-smallrye-jwt` confirmed absent from operations-service (pre-existing state preserved)

## Decisions Made

- No version tag on `quarkus-smallrye-health` — all 4 services use `quarkus-bom 3.27.2` which manages this version, so no explicit tag avoids drift
- operations-service was verified before editing — `quarkus-smallrye-jwt` was absent and remains absent after the edit

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This plan adds a dependency only; no UI rendering or data flow involved.

## Self-Check: PASSED

Files verified present:
- anotame-api/backend/identity-service/pom.xml — FOUND, contains quarkus-smallrye-health
- anotame-api/backend/catalog-service/pom.xml — FOUND, contains quarkus-smallrye-health
- anotame-api/backend/sales-service/pom.xml — FOUND, contains quarkus-smallrye-health
- anotame-api/backend/operations-service/pom.xml — FOUND, contains quarkus-smallrye-health

Commits verified:
- 014d441 — feat(07-01): add quarkus-smallrye-health to identity-service and catalog-service
- 3c26bfa — feat(07-01): add quarkus-smallrye-health to sales-service and operations-service
