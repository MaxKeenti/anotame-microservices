---
phase: 6
slug: database-migration-framework
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test infrastructure in any service (TEST-* deferred per REQUIREMENTS.md) |
| **Config file** | none |
| **Quick run command** | `mvn compile -pl {service} -q` (per-service compile check) |
| **Full suite command** | `docker compose up --build` (all 4 services start without DDL errors) |
| **Estimated runtime** | ~30 seconds (compile); ~120 seconds (full docker smoke) |

---

## Sampling Rate

- **After every task commit:** `mvn compile -pl {service} -q` for config/pom changes; `ls` file-existence check for SQL files
- **After every plan wave:** Full `docker compose up --build` must exit 0
- **Before `/gsd:verify-work`:** Full docker smoke must be green; all V1 baseline files must exist
- **Max feedback latency:** 30 seconds (compile)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 06-01 | 1 | DB-01 | compile | `mvn compile -pl identity-service -q` | ✅ (existing pom.xml) | ⬜ pending |
| 6-01-02 | 06-01 | 1 | DB-01 | compile | `mvn compile -pl catalog-service -q` | ✅ (existing pom.xml) | ⬜ pending |
| 6-01-03 | 06-01 | 1 | DB-01 | compile | `mvn compile -pl operations-service -q` | ✅ (existing pom.xml) | ⬜ pending |
| 6-01-04 | 06-01 | 1 | DB-01 | compile | `mvn compile -pl sales-service -q` | ✅ (existing pom.xml) | ⬜ pending |
| 6-02-01 | 06-02 | 1 | DB-02 | file check | `ls identity-service/src/main/resources/db/migration/V1__baseline.sql` | ❌ (new file) | ⬜ pending |
| 6-02-02 | 06-02 | 1 | DB-02 | file check | `ls catalog-service/src/main/resources/db/migration/V1__baseline.sql` | ❌ (new file) | ⬜ pending |
| 6-02-03 | 06-02 | 1 | DB-02 | file check | `ls operations-service/src/main/resources/db/migration/V1__baseline.sql` | ❌ (new file) | ⬜ pending |
| 6-02-04 | 06-02 | 1 | DB-02 | file check | `ls sales-service/src/main/resources/db/migration/V1__baseline.sql` | ❌ (new file) | ⬜ pending |
| 6-03-01 | 06-03 | 1 | DB-03 | file check | `ls sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql && ! ls migration.sql 2>/dev/null` | ❌ (new file) | ⬜ pending |
| 6-04-01 | 06-04 | 2 | DB-04 | manual | Docker staging validate — see manual instructions | ❌ (manual) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No new test framework installation required. All services compile with Maven.

Wave 0 directory setup (done at start of 06-02 execution):
- [ ] `identity-service/src/main/resources/db/migration/` — create if absent
- [ ] `catalog-service/src/main/resources/db/migration/` — create if absent
- [ ] `operations-service/src/main/resources/db/migration/` — create if absent
- [ ] `sales-service/src/main/resources/db/migration/` — create if absent

These directories are created as part of plan 06-02 task execution, not a separate Wave 0 plan.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 4 services start without Hibernate DDL errors after Flyway enabled | DB-01 | Requires running Docker Compose stack | `docker compose up --build` — confirm all 4 services reach STARTED state; grep logs for "HHH90000025" (DDL schema update warning) must be absent |
| 4 separate Flyway history tables created in DB | DB-04 | Requires running DB + connected services | `docker exec anotame-db psql -U admin -d anotame -c "\dt flyway_schema_history_*"` — must show 4 rows |
| `flyway validate` passes on staging DB clone | DB-04 | Requires provisioned staging environment | Spin up fresh Docker PostgreSQL, restore dump from live Railway DB, start all 4 services — confirm no validation errors in logs |
| Existing orders/customers data survives Flyway migration (no data loss) | DB-02 | Requires live data in running DB | After switching from auto-DDL to Flyway, confirm existing rows are readable via API endpoints |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` compile verify or file-existence check
- [x] Sampling continuity: every task has a verify step
- [x] Wave 0 covers all MISSING directory references (created in plan 06-02)
- [x] No watch-mode flags
- [x] Feedback latency < 30s for compile checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-02
