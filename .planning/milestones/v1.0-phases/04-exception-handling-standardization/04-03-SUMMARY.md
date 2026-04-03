---
phase: 04-exception-handling-standardization
plan: "03"
subsystem: infra
tags: [quarkus, hibernate-orm, logging, properties, config]

requires: []
provides:
  - SQL query logging gated to %dev profile in all 4 Quarkus services
  - Corrected quarkus.hibernate-orm.log.format-sql property name (was sql-formatting, silently ignored)
affects: [deployment, operations-reliability]

tech-stack:
  added: []
  patterns:
    - "Use %dev. profile prefix to gate debug logging properties in Quarkus application.properties"

key-files:
  created: []
  modified:
    - anotame-api/backend/identity-service/src/main/resources/application.properties
    - anotame-api/backend/catalog-service/src/main/resources/application.properties
    - anotame-api/backend/sales-service/src/main/resources/application.properties
    - anotame-api/backend/operations-service/src/main/resources/application.properties

key-decisions:
  - "Quarkus %dev profile prefix gates SQL logging so production (Railway) never emits Hibernate SQL; local dev retains formatted SQL"
  - "Corrected property name from sql-formatting (non-standard, silently ignored) to log.format-sql (Quarkus 3.x standard)"

patterns-established:
  - "Profile-gated logging: quarkus.hibernate-orm.log.sql=false as default, %dev.quarkus.hibernate-orm.log.sql=true as override"

requirements-completed: [QUAL-03]

duration: 3min
completed: 2026-04-01
---

# Phase 4 Plan 03: Gate SQL Logging to %dev Profile (all 4 services) Summary

**SQL query logging disabled in production (default) and enabled only in Quarkus %dev profile across all 4 services, with property name corrected from silent `sql-formatting` to standard `log.format-sql`**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-01T20:43:02Z
- **Completed:** 2026-04-01T20:46:11Z
- **Tasks:** 5 (Tasks 1-4 config edits + Task 5 verification)
- **Files modified:** 4

## Accomplishments

- Removed ungated `quarkus.hibernate-orm.log.sql=true` from all 4 services — production Railway logs will no longer contain Hibernate SQL queries
- Fixed incorrect `quarkus.hibernate-orm.sql-formatting=true` (silently ignored by Quarkus 3.x) with the correct `quarkus.hibernate-orm.log.format-sql` property name
- Added `%dev.` prefixed overrides so local development with `mvn quarkus:dev` still shows formatted SQL

## Task Commits

Each task was committed atomically:

1. **Task 1: Update identity-service application.properties** - `9fec66f` (fix)
2. **Task 2: Update catalog-service application.properties** - `586fce9` (fix)
3. **Task 3: Update sales-service application.properties** - `983703e` (fix)
4. **Task 4: Update operations-service application.properties** - `3cdda19` (fix)
5. **Task 5: Integration verification** - verified via grep (Docker not running in execution environment; see Issues below)

## Files Created/Modified

- `anotame-api/backend/identity-service/src/main/resources/application.properties` - Gated SQL logging to %dev profile, fixed property name
- `anotame-api/backend/catalog-service/src/main/resources/application.properties` - Gated SQL logging to %dev profile, fixed property name
- `anotame-api/backend/sales-service/src/main/resources/application.properties` - Gated SQL logging to %dev profile, fixed property name
- `anotame-api/backend/operations-service/src/main/resources/application.properties` - Gated SQL logging to %dev profile, fixed property name

## Decisions Made

- Used Quarkus profile prefix `%dev.` (not `%prod.` negation) to ensure correct behavior: default is `false` (safe for Railway), dev override is `true`
- Corrected property name from `sql-formatting` to `log.format-sql` — the former was never recognized by Quarkus 3.x and was silently ignored

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Task 5 (Docker Compose integration check):** Docker daemon was not running in the execution environment. The config-level verification was confirmed via `grep` on all 4 files (0 occurrences of `sql-formatting`, correct 4-line pattern present in each file). The Docker-based runtime verification (confirming absence of `Hibernate:` lines in container logs) should be performed as part of the next Railway deploy or manual `docker compose up --build`.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required. Changes are config-only and take effect on next service startup.

## Next Phase Readiness

- Phase 04 (exception-handling-standardization) is now complete — all 3 plans executed
- Railway production logs will be clean of SQL noise on next deploy
- Phase 05 can proceed

---
*Phase: 04-exception-handling-standardization*
*Completed: 2026-04-01*
