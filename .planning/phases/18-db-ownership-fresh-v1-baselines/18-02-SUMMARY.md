---
phase: 18-db-ownership-fresh-v1-baselines
plan: 02
subsystem: database
tags: [flyway, postgresql, migration, sales-service, schema, db-per-service]

# Dependency graph
requires:
  - phase: 18-01
    provides: Pattern for clean V1 baselines established (identity-service, catalog-service)
provides:
  - Clean sales-service V1 baseline with all incremental changes consolidated
  - Cross-service FK constraints removed from sales schema
  - status column consolidated (current_status dropped, status kept as VARCHAR(50))
  - branch_name snapshot column on tco_order
  - V2-V4 migration files deleted (folded into V1)
  - Flyway workaround flags removed from sales-service application.properties
affects:
  - phase-19-application-configuration
  - phase-20-dockerfile-railway-deployment
  - phase-21-local-dev-docker-compose

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Clean-slate V1 baseline: all incremental migrations folded into single V1; no V2+ files for fresh DB"
    - "Cross-service FKs dropped: bare UUID columns for cross-boundary references (garment_name, service_name denormalized snapshots remain)"
    - "Flyway flags baseline-on-migrate and baseline-version removed when per-service DB is clean-slate"

key-files:
  created: []
  modified:
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql
    - anotame-api/backend/sales-service/src/main/resources/application.properties
  deleted:
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V3__order_lifecycle_improvements.sql
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V4__add_price_list_to_order.sql

key-decisions:
  - "Drop tco_order_item.id_garment_type FK: catalog-service owns cci_garment_type; bare UUID is correct cross-boundary reference; garment_name snapshot preserves display data"
  - "Drop tco_order_item_service.id_service FK: catalog-service owns cci_service; bare UUID is correct; service_name snapshot preserves display data"
  - "Drop tco_order.id_branch FK: operations-service owns tce_branch; bare UUID is correct; branch_name snapshot added for UI display without cross-service HTTP call"
  - "Remove current_status column: Java OrderEntity maps only to status; current_status was a DB-only artifact with no ORM mapping"
  - "status typed as VARCHAR(50) not VARCHAR(255): matches Java entity's actual constraint; more precise"
  - "Flyway workaround flags removed: baseline-on-migrate, baseline-version only needed when migrating existing shared-DB schema; clean-slate DB needs neither"
  - "flyway.table custom name removed: per-service DB eliminates collision risk; default flyway_schema_history sufficient"

patterns-established:
  - "One V1 per service: migrations directory contains exactly one file for clean-slate deployment"
  - "Snapshot columns over cross-service FKs: branch_name, garment_name, service_name kept denormalized on the owning service's table"

requirements-completed: [DB-03, DB-05, DB-06, DB-07, DB-08]

# Metrics
duration: 8min
completed: 2026-04-15
---

# Phase 18 Plan 02: Sales-Service V1 Baseline Summary

**Sales-service schema rewritten as clean consolidated DDL: 3 cross-service FK constraints dropped, current_status removed, branch_name snapshot added, V2-V4 migrations folded into V1 and deleted**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-15T00:00:00Z
- **Completed:** 2026-04-15T00:08:00Z
- **Tasks:** 3
- **Files modified:** 2 (modified) + 3 (deleted)

## Accomplishments

- Replaced pg_dump preamble V1 (780 lines of shared-DB dump) with 102-line clean DDL baseline
- Folded V2 (unit_price on tco_order_item), V3 (pickup_code + tco_order_audit_log), V4 (price_list_id, price_list_name) into V1 and deleted the 3 incremental files
- Removed 3 cross-service FK constraints that cannot exist across separate PostgreSQL instances
- Consolidated dual status columns: dropped current_status (no Java mapping), kept status VARCHAR(50) with index
- Added branch_name VARCHAR(150) snapshot column to tco_order per DB-03
- Removed Flyway workaround flags (baseline-on-migrate, baseline-version, flyway.table) — not needed for clean-slate per-service DB

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite sales-service V1__baseline.sql** - `ad2f45d` (feat)
2. **Task 2: Delete V2, V3, V4 migration files** - `b18aa40` (chore)
3. **Task 3: Clean up sales-service application.properties** - `5a39bd0` (chore)

## Files Created/Modified

- `anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql` - Complete rewrite: clean DDL, 6 tables, 1 sequence, 4 indexes; all V2-V4 columns folded in; no pg_dump preamble; no cross-service FKs
- `anotame-api/backend/sales-service/src/main/resources/application.properties` - Removed baseline-on-migrate, baseline-version, flyway.table; kept migrate-at-start=true

**Deleted:**
- `anotame-api/backend/sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql` - Folded into V1
- `anotame-api/backend/sales-service/src/main/resources/db/migration/V3__order_lifecycle_improvements.sql` - Folded into V1
- `anotame-api/backend/sales-service/src/main/resources/db/migration/V4__add_price_list_to_order.sql` - Folded into V1

## Cross-Service FK Removal Rationale

Each dropped FK is safe because no Java ORM join or JPA association uses it — they were DB-only constraints:

| Dropped FK | Cross-boundary | Safe to drop because |
|-----------|---------------|---------------------|
| `tco_order_item.id_garment_type → cci_garment_type` | catalog-service | `garment_name VARCHAR(255)` snapshot already on tco_order_item |
| `tco_order_item_service.id_service → cci_service` | catalog-service | `service_name VARCHAR(255)` snapshot already on tco_order_item_service |
| `tco_order.id_branch → tce_branch` | operations-service | `branch_name VARCHAR(150)` snapshot added to tco_order in this plan |

## Decisions Made

- Used `status VARCHAR(50)` (not 255): matches Java entity mapping; old `current_status VARCHAR(50)` had no `@Column` mapping in OrderEntity — dropping it is a no-op at the ORM layer
- Index `idx_order_status ON tco_order(status)` replaces the removed `idx_order_status ON tco_order(current_status)` — query patterns unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- sales-service migration directory now contains exactly one file: V1__baseline.sql
- All three per-service baselines (identity, catalog, sales) are complete after 18-01 and 18-02
- Phase 19 (Application Configuration) can now wire per-service JDBC URLs and datasource credentials
- Phase 21 (Local Dev Docker Compose) can reference sales-service V1 as the init SQL source

---
*Phase: 18-db-ownership-fresh-v1-baselines*
*Completed: 2026-04-15*
