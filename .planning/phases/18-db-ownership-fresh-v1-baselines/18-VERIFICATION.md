---
phase: 18-db-ownership-fresh-v1-baselines
verified: 2026-04-16T00:00:00Z
status: passed
score: 32/32
overrides_applied: 0
re_verification: false
---

# Phase 18: DB Ownership Fresh V1 Baselines — Verification Report

**Phase Goal:** Each of the 4 services owns a clean, self-contained Flyway V1 baseline — no cross-service foreign keys, no pg_dump artifacts, no accumulated incremental migration files, no shared-DB vestiges
**Verified:** 2026-04-16T00:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

#### Plan 01 — identity-service and catalog-service

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | identity-service/db/migration/ contains exactly one SQL file: V1__baseline.sql | VERIFIED | `ls` output shows only `V1__baseline.sql`; no V2+ files present |
| 2 | identity-service V1__baseline.sql creates only cca_role and tca_user — no tables from other services | VERIFIED | File contains exactly 2 CREATE TABLE statements: `cca_role` and `tca_user` (lines 8 and 20) |
| 3 | identity-service V1__baseline.sql contains no pg_dump preamble | VERIFIED | No SET statement_timeout, no OWNER TO, no \restrict anywhere in the 34-line file |
| 4 | catalog-service/db/migration/ contains exactly one SQL file: V1__baseline.sql | VERIFIED | `ls` output shows only `V1__baseline.sql` |
| 5 | catalog-service V1__baseline.sql creates only cci_garment_type, cci_service, tcc_price_list, tcc_price_list_item | VERIFIED | File contains exactly 4 CREATE TABLE statements; all are catalog-owned tables |
| 6 | catalog-service V1__baseline.sql contains no pg_dump preamble | VERIFIED | No pg_dump noise found in 52-line file |
| 7 | identity-service application.properties has no quarkus.flyway.baseline-on-migrate line | VERIFIED | File verified line-by-line; only `quarkus.flyway.migrate-at-start=true` remains under Flyway section (line 49) |
| 8 | identity-service application.properties has no quarkus.flyway.baseline-version line | VERIFIED | Absent from file |
| 9 | identity-service application.properties has no quarkus.flyway.table line | VERIFIED | Absent from file |
| 10 | catalog-service application.properties has no quarkus.flyway.baseline-on-migrate line | VERIFIED | File verified line-by-line; only `quarkus.flyway.migrate-at-start=true` remains (line 37) |
| 11 | catalog-service application.properties has no quarkus.flyway.baseline-version line | VERIFIED | Absent from file |
| 12 | catalog-service application.properties has no quarkus.flyway.table line | VERIFIED | Absent from file |

#### Plan 02 — sales-service

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 13 | sales-service/db/migration/ contains exactly one SQL file: V1__baseline.sql — V2, V3, V4 files are gone | VERIFIED | `ls` output shows only `V1__baseline.sql`; V2, V3, V4 confirmed absent |
| 14 | sales-service V1__baseline.sql creates tco_customer, tco_order, tco_order_item, tco_order_item_service, tco_order_history, tco_order_audit_log, and sequence tco_ticket_number_seq | VERIFIED | File has exactly 6 CREATE TABLE statements and 1 CREATE SEQUENCE; all 6 tables named correctly (lines 15, 28, 57, 73, 85, 95) |
| 15 | sales-service V1__baseline.sql does NOT contain tco_order_item.id_garment_type FOREIGN KEY constraint | VERIFIED | `id_garment_type UUID NOT NULL` on line 60 — bare UUID, no REFERENCES clause |
| 16 | sales-service V1__baseline.sql does NOT contain tco_order_item_service.id_service FOREIGN KEY constraint | VERIFIED | `id_service UUID NOT NULL` on line 76 — bare UUID, no REFERENCES clause |
| 17 | sales-service V1__baseline.sql does NOT contain tco_order.id_branch FOREIGN KEY constraint | VERIFIED | `id_branch UUID NOT NULL` on line 31 — bare UUID, no REFERENCES clause |
| 18 | sales-service V1__baseline.sql contains tco_order.branch_name VARCHAR(150) column | VERIFIED | `branch_name VARCHAR(150)` on line 32 of tco_order definition |
| 19 | sales-service V1__baseline.sql does NOT contain tco_order.current_status column | VERIFIED | No occurrence of `current_status` anywhere in the 109-line file |
| 20 | sales-service V1__baseline.sql has tco_order.status as VARCHAR(50) | VERIFIED | `status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED'` on line 40 |
| 21 | V2/V3/V4 changes folded in (unit_price, pickup_code, tco_order_audit_log, price_list_id, price_list_name) | VERIFIED | `unit_price` on tco_order_item (line 63); `pickup_code VARCHAR(6)` (line 46), `price_list_id UUID` (line 47), `price_list_name VARCHAR(255)` (line 48) on tco_order; `tco_order_audit_log` table present (lines 95-103) |
| 22 | sales-service V1__baseline.sql contains no pg_dump preamble | VERIFIED | File starts with comment header, no SET/OWNER/lock_timeout lines |
| 23 | sales-service application.properties has no quarkus.flyway.baseline-on-migrate line | VERIFIED | File verified; only `quarkus.flyway.migrate-at-start=true` under Flyway section (line 36) |
| 24 | sales-service application.properties has no quarkus.flyway.baseline-version line | VERIFIED | Absent from file |
| 25 | sales-service application.properties has no quarkus.flyway.table line | VERIFIED | Absent from file |

#### Plan 03 — operations-service

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 26 | operations-service/db/migration/ contains exactly one SQL file: V1__baseline.sql — V2 file is gone | VERIFIED | `ls` output shows only `V1__baseline.sql`; V2 confirmed absent |
| 27 | operations-service V1__baseline.sql creates only its 8 tables — no identity, catalog, or sales tables | VERIFIED | 8 CREATE TABLE statements: tce_establishment, tce_branch, tce_employee_assignment, top_work_day, top_holiday, top_shift, tco_work_order, tco_work_order_item; no tca_user, cca_role, cci_*, tcc_*, tco_customer, or tco_order tables present |
| 28 | operations-service V1__baseline.sql does NOT contain top_shift.id_user FOREIGN KEY constraint | VERIFIED | `id_user UUID NOT NULL` on line 66 — bare UUID, no REFERENCES clause |
| 29 | operations-service V1__baseline.sql does NOT contain tce_employee_assignment.id_user FOREIGN KEY constraint | VERIFIED | `id_user UUID NOT NULL` on line 39 — bare UUID, no REFERENCES clause |
| 30 | operations-service V1__baseline.sql contains tce_establishment.primary_color VARCHAR(7) and font_family VARCHAR(32) | VERIFIED | Both columns present on lines 17-18 of tce_establishment definition |
| 31 | operations-service V1__baseline.sql contains no pg_dump preamble | VERIFIED | File starts with comment header; no SET/OWNER/lock_timeout lines in 92-line file |
| 32 | operations-service application.properties has no quarkus.flyway.baseline-on-migrate, baseline-version, or flyway.table lines | VERIFIED | File verified; only `quarkus.flyway.migrate-at-start=true` present (line 37) |

**Score:** 32/32 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql` | Clean identity schema — cca_role + tca_user only | VERIFIED | 34 lines; 2 tables; pgcrypto + citext extensions; no pg_dump noise |
| `anotame-api/backend/identity-service/src/main/resources/application.properties` | Flyway workaround flags removed | VERIFIED | baseline-on-migrate, baseline-version, flyway.table all absent; migrate-at-start=true present |
| `anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql` | Clean catalog schema — 4 catalog tables only | VERIFIED | 52 lines; 4 tables; pgcrypto extension; intra-service FKs preserved; no pg_dump noise |
| `anotame-api/backend/catalog-service/src/main/resources/application.properties` | Flyway workaround flags removed | VERIFIED | All 3 workaround keys absent; migrate-at-start=true present |
| `anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql` | Clean sales schema with consolidated migrations | VERIFIED | 109 lines; 6 tables + 1 sequence; all V2–V4 changes folded in; cross-service FKs dropped; no pg_dump noise |
| `anotame-api/backend/sales-service/src/main/resources/application.properties` | Flyway workaround flags removed | VERIFIED | All 3 workaround keys absent; migrate-at-start=true present |
| `anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql` | Clean operations schema with V2 folded in | VERIFIED | 92 lines; 8 tables; theme columns present; cross-service FKs dropped; no pg_dump noise |
| `anotame-api/backend/operations-service/src/main/resources/application.properties` | Flyway workaround flags removed | VERIFIED | All 3 workaround keys absent; migrate-at-start=true present |

### Deleted Files Confirmed Absent

| File | Expected | Status |
|------|----------|--------|
| `sales-service/db/migration/V2__add_unit_price_to_order_item.sql` | DELETED | VERIFIED — absent from migration dir |
| `sales-service/db/migration/V3__order_lifecycle_improvements.sql` | DELETED | VERIFIED — absent from migration dir |
| `sales-service/db/migration/V4__add_price_list_to_order.sql` | DELETED | VERIFIED — absent from migration dir |
| `operations-service/db/migration/V2__add_establishment_theme_fields.sql` | DELETED | VERIFIED — absent from migration dir |

### Key Link Verification

No key links were defined in the plan frontmatter for any sub-plan. These are DDL-only SQL migration files with no runtime wiring to verify — the "link" is Flyway picking up the file on startup, which is governed by the migrate-at-start=true property (verified present in all 4 services).

### Data-Flow Trace (Level 4)

Not applicable. All artifacts are SQL DDL files and application.properties configuration files. There is no dynamic data rendering involved — Level 4 tracing is skipped per process guidance (applies to components/pages that render dynamic data).

### Behavioral Spot-Checks

Step 7b: SKIPPED — SQL migration files have no runnable entry points to invoke directly. Correctness is structural (DDL content) and has been fully verified at Levels 1–3.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DB-01 | 18-01 | identity-service clean V1 baseline (cca_role, tca_user only) | SATISFIED | V1__baseline.sql contains exactly those 2 tables; no pg_dump artifacts |
| DB-02 | 18-01 | catalog-service clean V1 baseline (4 catalog tables, intra-service FKs preserved) | SATISFIED | V1__baseline.sql contains all 4 tables; cci_service.id_garment_type and tcc_price_list_item.id_price_list/id_service FK references are intra-service and preserved |
| DB-03 | 18-02 | sales-service clean V1 — V2–V4 folded, 3 cross-service FKs dropped, branch_name added | SATISFIED | V1 has 6 tables + sequence; no REFERENCES to cci_*/tce_branch; branch_name VARCHAR(150) present on tco_order |
| DB-04 | 18-03 | operations-service clean V1 — V2 folded, 2 cross-service FKs to identity dropped | SATISFIED | V1 has 8 tables; id_user on top_shift and tce_employee_assignment are bare UUIDs; primary_color and font_family present |
| DB-05 | 18-02 | tco_order dual status columns consolidated — status VARCHAR(50) kept, current_status removed | SATISFIED | status VARCHAR(50) on line 40 of sales V1; no current_status anywhere in file. Note: the requirement mentions "Java entity updated to match" but the entity already mapped only to `status` (no current_status @Column existed) — no Java change was required; this is a no-op confirmation |
| DB-06 | 18-01, 18-02, 18-03 | All 4 services have baseline-on-migrate removed | SATISFIED | Verified absent in all 4 application.properties files |
| DB-07 | 18-01, 18-02, 18-03 | All 4 services use default flyway_schema_history table name (custom names removed) | SATISFIED | No flyway.table key in any of the 4 application.properties files |
| DB-08 | 18-02, 18-03 | Old V2–V4 deleted from sales-service; V2 deleted from operations-service | SATISFIED | All 4 incremental migration files confirmed absent from their directories |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

All V1 SQL files are clean DDL with no TODOs, placeholders, or stubs. No hardcoded empty data patterns (empty arrays/objects) exist in SQL DDL context. The `return null`/`return {}` patterns are not applicable to SQL files.

### Human Verification Required

None. All verification items for this phase are structural (file content, schema definitions, configuration values) and fully verifiable programmatically without running a live database.

---

## Gaps Summary

No gaps. All 32 must-have truths verified, all 8 artifacts pass all applicable levels, all 8 requirements satisfied across the 3 sub-plans.

---

_Verified: 2026-04-16T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
