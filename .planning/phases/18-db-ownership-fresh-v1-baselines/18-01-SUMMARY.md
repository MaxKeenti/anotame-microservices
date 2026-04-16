---
phase: 18-db-ownership-fresh-v1-baselines
plan: 01
subsystem: database
tags: [flyway, postgresql, migration, identity-service, catalog-service, db-per-service]

# Dependency graph
requires: []
provides:
  - Clean identity-service V1 baseline — cca_role + tca_user only, no pg_dump noise
  - Clean catalog-service V1 baseline — 4 catalog tables only, no pg_dump noise
  - Flyway workaround flags removed from identity-service and catalog-service
affects:
  - 18-db-ownership-fresh-v1-baselines (plans 02-03 — sales-service and operations-service)
  - 19-application-configuration (CFG-01–03 — per-service datasource URL wiring)
  - 21-local-dev-docker-compose (DEV-01–03 — local init.sql must match these baselines)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Each service V1__baseline.sql contains only that service's owned tables — no shared monolith dump"
    - "Inline PRIMARY KEY / UNIQUE / REFERENCES constraints instead of separate ALTER TABLE blocks"
    - "CREATE EXTENSION IF NOT EXISTS guards prevent startup failure if extension already installed"
    - "Flyway default flyway_schema_history table name used — no per-service custom table needed with isolated DBs"

key-files:
  created: []
  modified:
    - anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql
    - anotame-api/backend/identity-service/src/main/resources/application.properties
    - anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql
    - anotame-api/backend/catalog-service/src/main/resources/application.properties

key-decisions:
  - "citext extension retained in identity-service V1 (tca_user.email is case-insensitive by intent); omitted from catalog-service V1 (no citext-typed columns in catalog tables)"
  - "Inline constraints chosen over separate ALTER TABLE ADD CONSTRAINT blocks — cleaner, idiomatic for fresh schema files"
  - "Custom flyway.table names (flyway_schema_history_identity, flyway_schema_history_catalog) removed — each service now has its own isolated DB so collision between history tables is impossible"
  - "baseline-on-migrate and baseline-version removed — these were only needed to avoid Flyway seeing a pre-existing shared-DB schema; with fresh isolated DBs Flyway starts clean"

patterns-established:
  - "Service V1 SQL: CREATE EXTENSION IF NOT EXISTS + owned tables only + inline constraints"
  - "application.properties Flyway section: only quarkus.flyway.migrate-at-start=true retained"

requirements-completed: [DB-01, DB-02, DB-06, DB-07]

# Metrics
duration: 12min
completed: 2026-04-15
---

# Phase 18 Plan 01: DB Ownership Fresh V1 Baselines Summary

**Replaced full pg_dump monolith V1 SQL files for identity-service and catalog-service with clean per-service schemas owning only their tables, and removed shared-DB Flyway workaround flags from both application.properties files.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-15T00:00:00Z
- **Completed:** 2026-04-15T00:12:00Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- identity-service V1__baseline.sql reduced from 787 lines (full shared-DB pg_dump) to 34 lines containing only `cca_role` and `tca_user`
- catalog-service V1__baseline.sql reduced from 787 lines to 50 lines containing only `cci_garment_type`, `cci_service`, `tcc_price_list`, and `tcc_price_list_item`
- Removed 3 shared-DB Flyway workaround properties from each service (`baseline-on-migrate`, `baseline-version`, `flyway.table`) — both services now use standard Flyway defaults suitable for isolated databases

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite identity-service V1__baseline.sql** - `3c7ba66` (feat)
2. **Task 2: Clean up identity-service application.properties** - `ad8b3db` (chore)
3. **Task 3: Rewrite catalog-service V1__baseline.sql** - `51e582c` (feat)
4. **Task 4: Clean up catalog-service application.properties** - `f65c738` (chore)

## Files Created/Modified

- `anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql` - Replaced 787-line pg_dump with 34-line clean schema: pgcrypto + citext extensions, cca_role and tca_user with inline constraints
- `anotame-api/backend/identity-service/src/main/resources/application.properties` - Removed baseline-on-migrate, baseline-version, and flyway.table=flyway_schema_history_identity; kept migrate-at-start=true
- `anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql` - Replaced 787-line pg_dump with 50-line clean schema: pgcrypto extension, 4 catalog-owned tables with intra-service FKs preserved
- `anotame-api/backend/catalog-service/src/main/resources/application.properties` - Removed baseline-on-migrate, baseline-version, and flyway.table=flyway_schema_history_catalog; kept migrate-at-start=true

## Decisions Made

- **citext retained in identity-service, omitted from catalog-service:** identity-service uses citext for email handling; catalog tables have no citext-typed columns so the extension is unnecessary overhead.
- **Inline constraints vs. ALTER TABLE blocks:** The pg_dump style uses separate `ALTER TABLE ONLY ... ADD CONSTRAINT` statements. Clean baselines use inline `PRIMARY KEY`, `UNIQUE`, and `REFERENCES` — simpler and more readable for a fresh schema file.
- **Custom flyway.table names removed:** Per-service custom table names (`flyway_schema_history_identity`, `flyway_schema_history_catalog`) were needed to prevent Flyway conflicts when all services shared one PostgreSQL database. With each service getting its own database, the Flyway default `flyway_schema_history` is safe and preferred.
- **baseline-on-migrate + baseline-version removed:** These flags told Flyway to treat the existing shared DB schema as V1. With fresh isolated databases, Flyway starts from a clean state and applies V1__baseline.sql directly — no baselining required.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- identity-service and catalog-service baselines are clean and independently deployable
- Plans 18-02 and 18-03 (sales-service and operations-service) follow the same pattern and can proceed
- Phase 19 (application configuration) depends on all Phase 18 baselines being stable — identity and catalog are now ready
- Local Docker Compose (Phase 21) init.sql for `anotame-identity-db` must seed only cca_role + tca_user; for `anotame-catalog-db` must seed only the 4 catalog tables

---
*Phase: 18-db-ownership-fresh-v1-baselines*
*Completed: 2026-04-15*
