---
phase: 06-database-migration-framework
plan: "03"
subsystem: database
tags: [flyway, postgresql, sql, migration, sales-service]

requires:
  - phase: 06-02
    provides: V1__baseline.sql in all 4 services and Flyway extension setup

provides:
  - V2__add_unit_price_to_order_item.sql in sales-service db/migration/
  - Removed repo-root migration.sql (pre-Flyway one-off script)

affects:
  - 06-04
  - Any plan that runs Flyway migrations against sales-service DB

tech-stack:
  added: []
  patterns:
    - "Versioned Flyway migration: one file per schema change, IF NOT EXISTS guard for idempotency on live DBs"

key-files:
  created:
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql
  modified: []

key-decisions:
  - "IF NOT EXISTS guard preserved in V2 migration — unit_price was added to live DB by Hibernate auto-DDL; migration must be no-op on existing databases"
  - "Repo-root migration.sql deleted — only referenced in docs comments, no runtime or build dependency"

patterns-established:
  - "Flyway V2 uses ALTER TABLE with IF NOT EXISTS for columns that may already exist on live DBs"

requirements-completed:
  - DB-03

duration: 3min
completed: 2026-04-02
---

# Phase 06 Plan 03: V2 Flyway Migration for unit_price Summary

**Flyway V2 migration for tco_order_item.unit_price column created in sales-service with idempotency guard; legacy repo-root migration.sql deleted**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-02T19:32:11Z
- **Completed:** 2026-04-02T19:35:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 deleted)

## Accomplishments

- Created V2__add_unit_price_to_order_item.sql in sales-service db/migration/ with correct Flyway naming
- Preserved the IF NOT EXISTS guard from the original migration.sql to ensure the migration is a no-op on databases where Hibernate auto-DDL already added the column
- Deleted the pre-Flyway one-off migration.sql from the repository root
- Confirmed V1__baseline.sql + V2__add_unit_price_to_order_item.sql are the only two files in the migration directory, in correct sequential order
- sales-service mvn compile exits 0 — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create V2 migration file and delete repo-root migration.sql** - `42d9bbe` (feat)
2. **Task 2: Verify migration numbering and compile** - (verify-only, no file changes)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `anotame-api/backend/sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql` - Flyway V2 migration adding unit_price DECIMAL(19,4) to tco_order_item; IF NOT EXISTS guard for idempotency
- `migration.sql` - DELETED (pre-Flyway one-off script, now superseded by V2 migration)

## Decisions Made

- IF NOT EXISTS guard preserved exactly as in the original file — removing it would cause "column already exists" failures on any DB with Hibernate auto-DDL history
- No SQL content changes made (DECIMAL(19,4) type, NOT NULL DEFAULT 0.0 preserved) — any change would cause Flyway checksum mismatch if Flyway has already recorded this migration on a running installation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- V2 migration is in place alongside V1__baseline.sql; sales-service migration directory is complete through plan 06-03
- Plan 06-04 can proceed — DB-03 requirement is satisfied
- No blockers for phase 06 continuation

---
*Phase: 06-database-migration-framework*
*Completed: 2026-04-02*
