---
phase: 18-db-ownership-fresh-v1-baselines
plan: 03
subsystem: database
tags: [flyway, postgresql, migrations, operations-service, schema, db-per-service]

# Dependency graph
requires:
  - phase: 18-db-ownership-fresh-v1-baselines-plan-01
    provides: identity-service clean V1 baseline pattern established
  - phase: 18-db-ownership-fresh-v1-baselines-plan-02
    provides: sales-service clean V1 baseline pattern established
provides:
  - operations-service V1__baseline.sql: clean self-contained schema (8 tables, no cross-service FKs)
  - V2 migration file deleted: theme columns folded into V1
  - operations-service application.properties: Flyway workaround flags removed
affects:
  - phase-19-application-configuration
  - phase-20-dockerfile-fixes-railway-deployment
  - phase-21-local-dev-docker-compose

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-service FK removal: bare UUID columns for references to tables owned by other services (no REFERENCES clause)"
    - "V2-into-V1 fold: consolidate additive migrations into baseline before first clean-slate deploy"
    - "Flyway workaround cleanup: remove baseline-on-migrate, baseline-version, and custom table flags when transitioning to db-per-service"

key-files:
  created: []
  modified:
    - anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql
    - anotame-api/backend/operations-service/src/main/resources/application.properties
  deleted:
    - anotame-api/backend/operations-service/src/main/resources/db/migration/V2__add_establishment_theme_fields.sql

key-decisions:
  - "top_shift.id_user and tce_employee_assignment.id_user kept as bare UUID NOT NULL with no REFERENCES clause — identity-service owns tca_user; no ORM join exists across service boundaries"
  - "primary_color VARCHAR(7) and font_family VARCHAR(32) folded from V2 into V1 tce_establishment — eliminates dual-migration on clean-slate DB"
  - "tco_work_order.id_order and tco_work_order_item.id_sales_order_item remain bare UUIDs — already had no FK in pg_dump source; cross-service references safe"
  - "quarkus.flyway.table=flyway_schema_history_operations removed — custom history table name was a shared-DB workaround to avoid cross-service collision; no longer needed with per-service DB"

patterns-established:
  - "Operations-service migration directory: single V1__baseline.sql only (no incremental files for clean-slate)"
  - "Cross-service UUID references: bare UUID NOT NULL, no REFERENCES, documented in file header comment"

requirements-completed: [DB-04, DB-06, DB-07, DB-08]

# Metrics
duration: 8min
completed: 2026-04-15
---

# Phase 18 Plan 03: Operations-Service V1 Baseline Summary

**Operations-service V1__baseline.sql rewritten as a clean 8-table schema with cross-service FKs dropped, V2 theme columns folded in, and Flyway workaround flags removed from application.properties.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-15T00:00:00Z
- **Completed:** 2026-04-15T00:08:00Z
- **Tasks:** 3
- **Files modified:** 2 (modified), 1 (deleted)

## Accomplishments

- Replaced the pg_dump of the full shared database (17 tables, cross-service FKs, pg_dump noise) with a clean self-contained 8-table schema owning only operations-service domain objects
- Dropped two cross-service FK constraints (`top_shift.id_user → tca_user` and `tce_employee_assignment.id_user → tca_user`) — identity-service owns `tca_user`; both columns remain as bare `UUID NOT NULL`
- Folded V2 migration (`primary_color VARCHAR(7)`, `font_family VARCHAR(32)` on `tce_establishment`) into V1 and deleted the V2 file
- Removed three Flyway workaround flags (`baseline-on-migrate`, `baseline-version`, `flyway.table`) that were needed only in the shared-DB era

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite operations-service V1__baseline.sql** - `ce0f57a` (feat)
2. **Task 2: Delete V2 migration file** - `d52861b` (feat)
3. **Task 3: Clean up operations-service application.properties** - `9ae4ca6` (feat)

## Files Created/Modified

- `anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql` — Complete rewrite: clean 8-table schema replacing pg_dump of full shared DB; cross-service FKs dropped; V2 theme columns folded in; no pg_dump preamble
- `anotame-api/backend/operations-service/src/main/resources/db/migration/V2__add_establishment_theme_fields.sql` — DELETED: changes consolidated into new V1
- `anotame-api/backend/operations-service/src/main/resources/application.properties` — Removed `baseline-on-migrate=true`, `baseline-version=1`, `table=flyway_schema_history_operations`; kept `migrate-at-start=true`

## Decisions Made

- **Cross-service FKs are safe to drop** because operations-service Java entities hold `id_user` as a plain UUID field with no `@ManyToOne` annotation pointing to an identity-service entity. The service uses these UUIDs for assignment/shift lookup only — no ORM join is ever attempted.
- **V2 fold is safe** because the deployment is clean-slate: no live Flyway history exists on the new per-service DB. Leaving V2 would cause Flyway to attempt `ALTER TABLE ADD COLUMN` on columns already present in V1.
- **Custom `flyway.table` removal** eliminates the shared-DB workaround (each service used a distinct history table name to avoid collision in one PostgreSQL instance). With per-service databases, Flyway's default table name (`flyway_schema_history`) is correct.

## Cross-Service FKs Removed

| Removed FK | Owned by | Safe to drop? |
|---|---|---|
| `top_shift.id_user → tca_user(id_user)` | identity-service | Yes — bare UUID, no ORM join |
| `tce_employee_assignment.id_user → tca_user(id_user)` | identity-service | Yes — bare UUID, no ORM join |

**Intra-service FKs kept:**
- `tce_branch.id_establishment → tce_establishment(id_establishment)`
- `tce_employee_assignment.id_branch → tce_branch(id_branch)`
- `tco_work_order_item.id_work_order → tco_work_order(id_work_order)`

**Cross-service bare UUIDs already safe (no FK existed in pg_dump source):**
- `tco_work_order.id_order` — sales-service owns tco_order
- `tco_work_order_item.id_sales_order_item` — sales-service owns tco_order_item

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three operations-service migration concerns resolved: clean V1, no V2, no Flyway workaround flags
- Phase 18 wave 1 (plans 01-03) covers identity, sales, and operations services
- Phase 19 (Application Configuration) can now wire `quarkus.datasource.jdbc.url` to the per-service database URL using environment variables

---
*Phase: 18-db-ownership-fresh-v1-baselines*
*Completed: 2026-04-15*
