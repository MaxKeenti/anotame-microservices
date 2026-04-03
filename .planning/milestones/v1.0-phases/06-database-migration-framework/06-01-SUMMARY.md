---
phase: 06-database-migration-framework
plan: 01
subsystem: database
tags: [flyway, quarkus, postgresql, migration, pom, properties]

# Dependency graph
requires:
  - phase: 05-frontend-pattern-compliance
    provides: stable backend services ready for schema management
provides:
  - quarkus-flyway extension in all 4 service pom.xml files (BOM-managed)
  - per-service Flyway history tables preventing cross-service conflicts on shared DB
  - migrate-at-start enabled; prod DDL gate disabling Hibernate auto-DDL in production
affects:
  - 06-02-PLAN.md (baseline SQL and migration scripts will use this Flyway config)
  - all 4 backend services (identity, catalog, sales, operations)

# Tech tracking
tech-stack:
  added: [quarkus-flyway (3.27.2 via BOM)]
  patterns:
    - per-service Flyway history table names to avoid conflicts on shared PostgreSQL DB
    - profile-gated %prod override for Hibernate DDL to none while dev retains update
    - baseline-version=1 stamps existing DB as already at V1 preventing non-empty schema error

key-files:
  created: []
  modified:
    - anotame-api/backend/identity-service/pom.xml
    - anotame-api/backend/catalog-service/pom.xml
    - anotame-api/backend/sales-service/pom.xml
    - anotame-api/backend/operations-service/pom.xml
    - anotame-api/backend/identity-service/src/main/resources/application.properties
    - anotame-api/backend/catalog-service/src/main/resources/application.properties
    - anotame-api/backend/sales-service/src/main/resources/application.properties
    - anotame-api/backend/operations-service/src/main/resources/application.properties

key-decisions:
  - "quarkus-flyway added without explicit version — BOM at 3.27.2 manages version transitively to avoid incompatibility"
  - "Per-service Flyway table names (flyway_schema_history_{service}) are mandatory — all 4 services share a single PostgreSQL DB and concurrent Flyway instances would corrupt each other's migration state without distinct table names"
  - "baseline-version=1 prevents non-empty schema error on first contact with existing live DB — V1 stamped as already applied, only V2+ migrations run"
  - "%prod.quarkus.hibernate-orm.database.generation=none overrides bare update only in production; bare property kept for dev convenience without profile prefix"

patterns-established:
  - "Flyway per-service table isolation pattern: each service owns flyway_schema_history_{service_name}"
  - "Quarkus profile gate pattern: %prod. prefix to override dev defaults in production without removing dev convenience settings"

requirements-completed: [DB-01, DB-04]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 06 Plan 01: Database Migration Framework - Flyway Extension Setup Summary

**quarkus-flyway (BOM-managed) added to all 4 backend services with per-service history tables and prod DDL gate disabling Hibernate auto-DDL in production**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-02T15:04:00Z
- **Completed:** 2026-04-02T15:07:03Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added quarkus-flyway dependency (no explicit version, BOM-managed) to all 4 service pom.xml files grouped after quarkus-hibernate-orm-panache
- Configured distinct Flyway history table names per service to prevent cross-service state corruption on shared PostgreSQL DB
- Enabled migrate-at-start with baseline-on-migrate and baseline-version=1 in all 4 services
- Added %prod.quarkus.hibernate-orm.database.generation=none to all 4 services; bare update line preserved for local dev
- All 4 services compile cleanly after both changes (mvn compile exits 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add quarkus-flyway dependency to all 4 pom.xml files** - `2094227` (chore)
2. **Task 2: Configure Flyway properties in all 4 application.properties files** - `19442e5` (chore)

## Files Created/Modified
- `anotame-api/backend/identity-service/pom.xml` - Added quarkus-flyway dependency after quarkus-hibernate-orm-panache
- `anotame-api/backend/catalog-service/pom.xml` - Added quarkus-flyway dependency after quarkus-hibernate-orm-panache
- `anotame-api/backend/sales-service/pom.xml` - Added quarkus-flyway dependency after quarkus-hibernate-orm-panache
- `anotame-api/backend/operations-service/pom.xml` - Added quarkus-flyway dependency after quarkus-hibernate-orm-panache
- `anotame-api/backend/identity-service/src/main/resources/application.properties` - Flyway config block + prod DDL gate (table=flyway_schema_history_identity)
- `anotame-api/backend/catalog-service/src/main/resources/application.properties` - Flyway config block + prod DDL gate (table=flyway_schema_history_catalog)
- `anotame-api/backend/sales-service/src/main/resources/application.properties` - Flyway config block + prod DDL gate (table=flyway_schema_history_sales)
- `anotame-api/backend/operations-service/src/main/resources/application.properties` - Flyway config block + prod DDL gate (table=flyway_schema_history_operations)

## Decisions Made
- quarkus-flyway added without explicit version — Quarkus BOM 3.27.2 manages the Flyway version transitively; adding an explicit version would risk incompatibility
- Per-service Flyway history table names are mandatory for the shared single PostgreSQL DB (`anotame`); without distinct names concurrent Flyway instances would corrupt each other's migration state
- baseline-version=1 prevents "Found non-empty schema but no history table" error on first contact with existing live DB; V1__baseline.sql will be stamped as already applied, only V2+ migrations execute against production
- Two lines coexist intentionally: bare `quarkus.hibernate-orm.database.generation=update` for dev, `%prod.quarkus.hibernate-orm.database.generation=none` for Railway production

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Flyway will activate automatically on next service startup once V1 baseline SQL files are added in plan 06-02.

## Next Phase Readiness
- quarkus-flyway extension configured and verified in all 4 services
- Per-service history tables defined and unique — ready for 06-02 (V1 baseline SQL generation)
- Production DDL gate in place — Hibernate will not auto-create/alter tables in Railway once V1__baseline.sql exists
- Blocker noted in STATE.md remains: staging DB environment must exist or be provisioned before flyway validate can run

---
*Phase: 06-database-migration-framework*
*Completed: 2026-04-02*
