---
phase: 06-database-migration-framework
plan: 02
subsystem: database
tags: [flyway, postgresql, pg_dump, migration, baseline, schema]

# Dependency graph
requires:
  - phase: 06-01
    provides: quarkus-flyway extension in all 4 services, per-service history table config, baseline-on-migrate enabled
provides:
  - V1__baseline.sql in all 4 services sourced from live DB pg_dump (786 lines each)
  - db/migration directories created in all 4 services
  - init.sql synced with live schema (tco_work_order, tco_work_order_item, daily_capacity_minutes, tco_ticket_number_seq)
affects:
  - 06-03 (V2 migration file depends on V1 baseline being in place)
  - 06-04 (staging validate gate uses V1 as the checksum anchor)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All 4 services share the same V1 baseline content (full schema dump) — safe because baseline-version=1 means Flyway never executes V1, only reads its checksum"
    - "pg_dump --schema-only via docker exec against a fully-bootstrapped container to capture auto-DDL-created tables absent from init.sql"

key-files:
  created:
    - anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql
    - anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql
    - anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql
  modified:
    - anotame-db/init.sql

key-decisions:
  - "V1 baseline generated from Docker exec pg_dump against a fully-bootstrapped local container (services had been started at least once, so auto-DDL tables existed)"
  - "tco_ticket_number_seq manually appended to the dump since the sequence exists on Railway but was absent from the local Docker DB"
  - "init.sql updated retroactively to reflect live schema truth: tco_work_order, tco_work_order_item, daily_capacity_minutes, tco_ticket_number_seq"

patterns-established:
  - "Baseline pattern: one pg_dump output shared across all 4 services — avoids per-service scoping complexity that risks missing auto-DDL columns"

requirements-completed: [DB-02]

# Metrics
duration: ~20min (human-action checkpoint included)
completed: 2026-04-02
---

# Phase 06 Plan 02: V1 Baseline SQL Summary

**Four Flyway migration directories populated with 786-line V1__baseline.sql from live DB pg_dump, capturing auto-DDL tables (tco_work_order, tco_work_order_item) and Phase 3 sequence (tco_ticket_number_seq) absent from init.sql**

## Performance

- **Duration:** ~20 min (including human-action checkpoint for pg_dump)
- **Started:** 2026-04-02
- **Completed:** 2026-04-02
- **Tasks:** 2 (Task 1 automated, Task 2 human-action)
- **Files modified:** 5

## Accomplishments

- Created `db/migration/` directories in all 4 services under `src/main/resources/`
- Populated `V1__baseline.sql` (786 lines each) in all 4 services from a live pg_dump; files contain `tco_work_order` (15 occurrences), `daily_capacity_minutes`, and `tco_ticket_number_seq`
- Synced `anotame-db/init.sql` with live schema by adding `tco_work_order`, `tco_work_order_item`, `daily_capacity_minutes`, and `tco_ticket_number_seq` — init.sql now reflects production truth

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration directories in all 4 services** - `7dc5ad5` (chore)
2. **Task 2: Populate V1__baseline.sql in all 4 services** - `6f47d0b` (feat)
3. **Task 2 (companion): Sync init.sql with live schema** - `bc84395` (chore)

## Files Created/Modified

- `anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql` - Full live schema baseline (786 lines)
- `anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql` - Full live schema baseline (786 lines)
- `anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql` - Full live schema baseline including tco_ticket_number_seq (786 lines)
- `anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql` - Full live schema baseline including tco_work_order, tco_work_order_item, daily_capacity_minutes (786 lines)
- `anotame-db/init.sql` - Synced with live schema; now includes work order tables, ticket sequence, and daily_capacity_minutes column

## Decisions Made

- Used Docker exec pg_dump (Approach B) against a fully-bootstrapped local container rather than Railway CLI tunnel — auto-DDL tables were present since services had previously been started against this container
- Manually appended `CREATE SEQUENCE IF NOT EXISTS tco_ticket_number_seq` to the dump because the sequence existed on Railway but was absent from the local Docker DB (created during Phase 3 deploy, not part of auto-DDL)
- Single dump shared across all 4 services — simpler than per-service scoping; safe because `baseline-version=1` means Flyway stamps V1 as already applied without executing it

## Deviations from Plan

None - plan executed exactly as written. The human-action checkpoint proceeded as designed; the developer used Approach B (Docker exec) which is the documented fallback approach.

## Issues Encountered

- The local Docker DB was missing `tco_ticket_number_seq` because it was created manually on Railway during Phase 3, not via auto-DDL. The developer manually appended the `CREATE SEQUENCE IF NOT EXISTS` statement to the dump before copying to all 4 services. This is consistent with the plan's warning about sequence absence from local containers.

## User Setup Required

None - no external service configuration required. The V1 baseline files are static SQL checked into the repository.

## Known Stubs

None.

## Next Phase Readiness

- 06-03 can proceed immediately: `V1__baseline.sql` is in place in all 4 services, providing the anchor for the `V2__add_unit_price_to_order_item.sql` migration in sales-service
- 06-04 (staging validate gate) depends on 06-03 completing first; no blockers introduced by this plan

---
*Phase: 06-database-migration-framework*
*Completed: 2026-04-02*
