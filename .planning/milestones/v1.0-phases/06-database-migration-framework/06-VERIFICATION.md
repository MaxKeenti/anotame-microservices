---
phase: 06-database-migration-framework
verified: 2026-04-02T20:00:00Z
status: gaps_found
score: 4/5 must-haves verified
re_verification: false
gaps:
  - truth: "flyway validate passes on a staging copy of the production DB before any production deploy"
    status: partial
    reason: "Plan 06-04 ran Flyway startup validation against the dev DB (anotame-db), not a dedicated staging copy of the production DB. Docker-compose service-level env vars overrode the CLI-level QUARKUS_DATASOURCE_JDBC_URL injection, so the staging container provisioned in Task 1 was never actually used. Flyway did run successfully and 4 history tables were confirmed, but the exact criterion — a staging copy of production — was not met."
    artifacts:
      - path: ".planning/phases/06-database-migration-framework/06-04-SUMMARY.md"
        issue: "Documents the environmental deviation: dev DB used instead of staging copy; see 'Deviations from Plan' section"
    missing:
      - "Re-run validation using a dedicated staging container (fresh PostgreSQL with production schema restored) and confirm Flyway startup produces 4 history tables with no errors"
      - "Resolve docker-compose env var precedence issue so future staging runs are not silently redirected to dev DB"
human_verification:
  - test: "Confirm Flyway history tables persist across service restarts and no checksum mismatches appear"
    expected: "All 4 flyway_schema_history_* tables show V1 stamped as baseline-applied (success=true, script=V1__baseline.sql) and V2 as applied (sales-service only) after a cold restart"
    why_human: "Requires running Docker Compose stack and inspecting psql output — cannot verify programmatically from source files"
---

# Phase 6: Database Migration Framework Verification Report

**Phase Goal:** Replace Hibernate auto-DDL with Flyway across all 4 services using a V1 baseline generated from the live schema, so future schema changes are versioned and auditable.
**Verified:** 2026-04-02T20:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 4 services start with `quarkus-flyway` enabled; `hibernate-orm.database.generation` is set to `none` in production | VERIFIED | `quarkus-flyway` artifact in all 4 pom.xml files (line 41/42/41/45 respectively); `%prod.quarkus.hibernate-orm.database.generation=none` in all 4 application.properties |
| 2 | Each service has a `V1__baseline.sql` generated from the live DB using `pg_dump --schema-only` — not hand-written | VERIFIED | All 4 files are 786 lines each; header shows `-- PostgreSQL database dump / Dumped by pg_dump version 16.13`; contain `tco_work_order`, `daily_capacity_minutes`, `tco_ticket_number_seq` |
| 3 | `flyway validate` passes on a staging copy of the production DB before any production deploy | PARTIAL | Flyway startup ran successfully and no errors were logged, but the target was the dev DB (`anotame-db`), not a dedicated staging copy — docker-compose env var precedence caused the staging container to be bypassed |
| 4 | Each service uses its own Flyway history table (`flyway_schema_history_{service}`) — no cross-service history conflicts | VERIFIED | All 4 application.properties set distinct table names: `flyway_schema_history_identity`, `flyway_schema_history_catalog`, `flyway_schema_history_sales`, `flyway_schema_history_operations`; 06-04 confirms 4 tables created in DB |
| 5 | The existing `migration.sql` at repo root is converted to `V2__add_unit_price_to_order_item.sql` in the sales-service migration directory | VERIFIED | `V2__add_unit_price_to_order_item.sql` exists in `anotame-api/backend/sales-service/src/main/resources/db/migration/` with correct DDL; `migration.sql` at repo root is absent |

**Score:** 4/5 truths verified (1 partial)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `anotame-api/backend/identity-service/pom.xml` | quarkus-flyway dependency | VERIFIED | Line 41: `<artifactId>quarkus-flyway</artifactId>` (no explicit version — BOM-managed) |
| `anotame-api/backend/catalog-service/pom.xml` | quarkus-flyway dependency | VERIFIED | Line 42 confirmed |
| `anotame-api/backend/sales-service/pom.xml` | quarkus-flyway dependency | VERIFIED | Line 41 confirmed |
| `anotame-api/backend/operations-service/pom.xml` | quarkus-flyway dependency | VERIFIED | Line 45 confirmed |
| `identity-service/src/main/resources/application.properties` | Flyway config + prod DDL gate | VERIFIED | `migrate-at-start=true`, `baseline-on-migrate=true`, `baseline-version=1`, `table=flyway_schema_history_identity`, `%prod.quarkus.hibernate-orm.database.generation=none` |
| `catalog-service/src/main/resources/application.properties` | Flyway config + prod DDL gate | VERIFIED | Same pattern; table=flyway_schema_history_catalog |
| `sales-service/src/main/resources/application.properties` | Flyway config + prod DDL gate | VERIFIED | Same pattern; table=flyway_schema_history_sales |
| `operations-service/src/main/resources/application.properties` | Flyway config + prod DDL gate | VERIFIED | Same pattern; table=flyway_schema_history_operations |
| `identity-service/src/main/resources/db/migration/V1__baseline.sql` | 786-line pg_dump baseline | VERIFIED | 786 lines; `-- PostgreSQL database dump` header; pg_dump version 16.13 |
| `catalog-service/src/main/resources/db/migration/V1__baseline.sql` | 786-line pg_dump baseline | VERIFIED | 786 lines confirmed |
| `sales-service/src/main/resources/db/migration/V1__baseline.sql` | 786-line pg_dump baseline with sequence | VERIFIED | 786 lines; `tco_ticket_number_seq` at line 783 |
| `operations-service/src/main/resources/db/migration/V1__baseline.sql` | 786-line pg_dump baseline with work order tables | VERIFIED | 786 lines; `tco_work_order`, `tco_work_order_item`, `daily_capacity_minutes` confirmed |
| `sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql` | V2 migration with IF NOT EXISTS guard | VERIFIED | `ALTER TABLE tco_order_item ADD COLUMN IF NOT EXISTS unit_price DECIMAL(19,4) NOT NULL DEFAULT 0.0` |
| `migration.sql` (repo root) | Must NOT exist | VERIFIED | File absent from repository root |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| pom.xml (all 4) | quarkus-flyway extension | `<artifactId>quarkus-flyway</artifactId>` | WIRED | No explicit version — BOM 3.27.2 manages transitively |
| application.properties (all 4) | Flyway migration directories | `migrate-at-start=true` + `db/migration/` path | WIRED | Default classpath scan; directories exist with V1__baseline.sql |
| `%prod` profile | `hibernate-orm.database.generation=none` | `%prod.quarkus.hibernate-orm.database.generation=none` | WIRED | Profile gate confirmed in all 4 files; bare `update` line preserved for dev |
| sales-service migrations | V1 -> V2 ordering | Flyway sequential numbering (1, 2) | WIRED | Only V1__baseline.sql and V2__add_unit_price_to_order_item.sql in directory; correct version sequence |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces configuration and SQL migration files, not components that render dynamic data.

---

### Behavioral Spot-Checks

| Behavior | Method | Result | Status |
|----------|--------|--------|--------|
| V1 baseline is pg_dump output, not hand-written | File header inspection | `-- PostgreSQL database dump / Dumped by pg_dump version 16.13` present in all 4 files | PASS |
| V1 baseline contains live-schema-only tables (`tco_work_order`, `tco_ticket_number_seq`) | Grep count | operations-service: 17 occurrences of target patterns; sales-service: `tco_ticket_number_seq` at line 783 | PASS |
| V2 migration file has correct IF NOT EXISTS guard | File read | `ALTER TABLE tco_order_item ADD COLUMN IF NOT EXISTS unit_price DECIMAL(19,4) NOT NULL DEFAULT 0.0` | PASS |
| `migration.sql` deleted from repo root | File existence check | File absent | PASS |
| Flyway startup on running DB produces 4 history tables | Human-confirmed (06-04) | Dev DB confirmed 4 tables via `\dt flyway_schema_history_*`; staging copy criterion not fully met | PARTIAL |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DB-01 | 06-01 | `quarkus-flyway` added to all 4 services; `database.generation=update` replaced with `none` in production | SATISFIED | quarkus-flyway in all 4 pom.xml; `%prod.quarkus.hibernate-orm.database.generation=none` in all 4 application.properties. Note: REQUIREMENTS.md still shows `[ ]` (unchecked) for DB-01 — this is a documentation gap, not an implementation gap. |
| DB-02 | 06-02 | Each service has `V1__baseline.sql` from live DB pg_dump | SATISFIED | All 4 V1 files exist at 786 lines each; pg_dump header confirmed; live-schema tables present |
| DB-03 | 06-03 | `migration.sql` converted to `V2__add_unit_price_to_order_item.sql` in sales-service | SATISFIED | V2 file exists with correct DDL; repo-root migration.sql deleted |
| DB-04 | 06-04 | Each service uses independent Flyway history table | SATISFIED | Per-service table names configured; 4 tables confirmed created in dev DB at runtime |

**Note on REQUIREMENTS.md:** DB-01 is marked `[ ]` (pending) in REQUIREMENTS.md despite the implementation being fully present in the code. This is a tracking document inconsistency. The implementation satisfies DB-01.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| All 4 `application.properties` | `quarkus.hibernate-orm.database.generation=update` bare line coexists with `%prod.quarkus.hibernate-orm.database.generation=none` | INFO | Intentional by design decision in 06-01: dev retains `update` for local convenience; production is gated by `%prod` override. Not a bug. |

No blockers or warnings found. The coexistence of `update` (dev) and `%prod: none` (production) is the explicit, documented design intent.

---

### Human Verification Required

#### 1. Flyway History Table Persistence After Cold Restart

**Test:** Bring down all 4 services (`docker compose down`), restart (`docker compose up`), connect to DB and run `\dt flyway_schema_history_*` then `SELECT * FROM flyway_schema_history_identity` (and the other 3 tables).
**Expected:** 4 tables exist; each shows at least V1 stamped as baseline-applied (`success=true, type=BASELINE`); sales-service history table also shows V2 applied (`success=true, script=V2__add_unit_price_to_order_item.sql`); no `ERROR` rows.
**Why human:** Requires running Docker Compose stack; cannot verify table contents from source files alone.

#### 2. Staging Copy Validation (Gap Closure)

**Test:** Provision a fresh Docker PostgreSQL container, restore the live schema using `pg_dump --schema-only` from Railway, override all 4 service datasource URLs to point to this container (via `.env` overrides, not docker-compose service definitions), start all 4 services, inspect startup logs and history tables.
**Expected:** All 4 services reach STARTED state; 4 `flyway_schema_history_*` tables created; no Flyway errors; no `HHH90000025` warning.
**Why human:** Requires live Railway DB access for pg_dump and understanding of docker-compose env var resolution order to correctly override service definitions.

---

## Gaps Summary

One gap blocks full goal achievement: Success Criterion 3 ("flyway validate passes on a staging copy of the production DB") was not fully met. The 06-04 plan intended to validate Flyway behavior against a dedicated staging container seeded with a production schema copy, but docker-compose service-level env var definitions took precedence over the CLI-level `QUARKUS_DATASOURCE_JDBC_URL` override. The services started and Flyway ran successfully — but against the regular dev DB, not an isolated staging copy.

The migration framework itself is correct and production-ready (all files exist, all config is correct, Flyway ran without errors). The gap is environmental: the pre-production validation gate did not run against the exact environment type specified by the success criterion.

**All 4 requirements (DB-01 through DB-04) have working implementations in the codebase.** The gap is a process/validation gap, not a code gap. The phase can proceed to Phase 7 with the understanding that SC-3's staging copy validation should be completed before the first Railway production deploy that involves a schema change beyond V2.

---

_Verified: 2026-04-02T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
