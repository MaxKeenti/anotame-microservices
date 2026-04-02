# Phase 6: Database Migration Framework - Research

**Researched:** 2026-04-02
**Domain:** Quarkus Flyway integration, PostgreSQL schema management, shared-DB multi-service migration strategy
**Confidence:** HIGH

---

## Summary

All 4 backend services (identity, catalog, sales, operations) share a **single PostgreSQL database** (`anotame`) with a **single schema** (`public`). Every service connects to the same `jdbc:postgresql://anotame-db:5432/anotame` URL with the same `QUARKUS_DATASOURCE_*` credentials. This is the dominant risk for this phase: without per-service history tables, all 4 Flyway instances would fight over the default `flyway_schema_history` table and produce undefined behavior.

The current state is `quarkus.hibernate-orm.database.generation=update` in all 4 `application.properties` files — **with no `%prod` profile gate**. This means auto-DDL runs in production today. Phase 6 must flip this to `none` with `%prod` gating, and Flyway must take ownership of all DDL.

There is one known schema drift item: `EstablishmentJpa` has a `daily_capacity_minutes` column that does not appear in `anotame-db/init.sql`. The live database has this column (auto-DDL added it). The `V1__baseline.sql` for operations-service must be generated from the live DB via `pg_dump --schema-only`, not from `init.sql` — this is already a locked decision.

**Primary recommendation:** Add `quarkus-flyway` to all 4 `pom.xml` files, configure `quarkus.flyway.migrate-at-start=true`, `quarkus.flyway.baseline-on-migrate=true`, per-service history tables, and set `%prod.quarkus.hibernate-orm.database.generation=none` in all 4 `application.properties` files. Generate V1 baselines by running `pg_dump --schema-only --table=<owned_tables>` per service against the live Railway DB.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DB-01 | `quarkus-flyway` extension added to all 4 services; `database.generation=update` replaced with `none` in production | Extension artifact confirmed: `quarkus-flyway` in `io.quarkus` group, managed by BOM 3.27.2. Profile-gate syntax confirmed. |
| DB-02 | Each service has a `V1__baseline.sql` generated from live DB using `pg_dump --schema-only` | Table ownership per service mapped. `pg_dump` not on developer machine PATH but available inside `anotame-db` container. |
| DB-03 | `migration.sql` at repo root converted to `V2__add_unit_price_to_order_item.sql` in sales-service migrations | `migration.sql` content confirmed: single `ALTER TABLE tco_order_item ADD COLUMN IF NOT EXISTS unit_price`. Unit_price already present in `init.sql` and the live schema (auto-DDL applied it), so the `IF NOT EXISTS` guard makes the SQL idempotent on existing DBs. |
| DB-04 | Each service uses an independent Flyway history table (`flyway_schema_history_{service}`) | Property `quarkus.flyway.table` confirmed from official Quarkus Flyway guide. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

- **Hexagonal Architecture**: No framework coupling in domain layer — Flyway migration files live in `infrastructure/` resources, not domain.
- **Build verification**: Every change must pass `bun run build` (exit 0) before commit. Backend changes verified via `docker compose up --build`.
- **Profile-gated config**: Established pattern for prod-only properties is `%prod.quarkus.*=value` (confirmed from Phase 4 SQL logging work — uses `%dev.` prefix for dev-only overrides).
- **Flyway V1 must use `pg_dump`**: Locked decision from project initialization — not hand-written SQL.
- **Staging validate required**: Locked decision — `flyway validate` must pass on staging before any production deploy.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `quarkus-flyway` | BOM-managed (Quarkus 3.27.2) | Schema migration lifecycle | Official Quarkus extension; version managed by BOM — no explicit version in `<dependency>` |
| Flyway Community | BOM-managed | Underlying migration engine | Transitively pulled by `quarkus-flyway` |
| PostgreSQL 16 | (via Docker image) | Target database | Already in use |

**No explicit version needed in pom.xml.** The Quarkus BOM at 3.27.2 manages the Flyway version transitively. The dependency block is:

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-flyway</artifactId>
</dependency>
```

**Installation — add to each of the 4 service `pom.xml` `<dependencies>` blocks:**
```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-flyway</artifactId>
</dependency>
```

### Supporting Tools (runtime, not Maven deps)
| Tool | Purpose | Availability |
|------|---------|-------------|
| `pg_dump` | Generate V1 baseline SQL from live DB | NOT on developer machine PATH — must run inside the `anotame-db` Docker container or via Railway CLI |
| `flyway validate` | Staging gate before production deploy | CLI tool, not a Quarkus property — run as a Docker one-shot or via Flyway CLI |

---

## Architecture Patterns

### Recommended Migration Directory Structure (per service)
```
{service}/src/main/resources/
└── db/
    └── migration/
        ├── V1__baseline.sql         # Generated from pg_dump --schema-only
        └── V2__add_unit_price_to_order_item.sql  # sales-service only
```

Quarkus Flyway default location is `db/migration` (classpath). No additional `quarkus.flyway.locations` override needed unless the default is changed.

### Pattern 1: Per-Service Flyway Configuration
**What:** Each service declares its own history table name so all 4 instances share the same physical database without colliding on migration history.
**When to use:** Any time multiple services share one database — mandatory here.

```properties
# Source: https://quarkus.io/guides/flyway

# Flyway — enable and auto-migrate at startup
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.baseline-version=1

# Per-service history table (prevents cross-service Flyway conflicts on shared DB)
quarkus.flyway.table=flyway_schema_history_identity

# Hibernate — disable auto-DDL in production; dev retains update for local convenience
%prod.quarkus.hibernate-orm.database.generation=none
```

Each service changes only `quarkus.flyway.table` to its own name.

### Pattern 2: Profile-Gated Hibernate DDL
**What:** Use `%prod.` prefix to disable auto-DDL in production only. Dev profile continues using `update` to allow local schema changes without running migrations.

```properties
# Current state (ALL 4 services — unset means applies to all profiles):
quarkus.hibernate-orm.database.generation=update

# Target state after Phase 6:
quarkus.hibernate-orm.database.generation=update    # kept for local dev
%prod.quarkus.hibernate-orm.database.generation=none  # production: Flyway owns DDL
```

**Why `update` kept for dev:** Developers can iterate on entities locally without writing migrations for every change. Production is the only profile where Flyway is authoritative.

### Pattern 3: baseline-on-migrate for Existing Databases
**What:** When Flyway encounters an existing schema with no `flyway_schema_history_*` table, `baseline-on-migrate=true` tells it to stamp the DB at `baseline-version=1` and only run migrations ABOVE V1. Without this, Flyway refuses to migrate a non-empty schema.
**Critical:** `baseline-version=1` means V1__baseline.sql is NEVER executed against the live DB (it's already applied). Only V2 and beyond will run.

### Anti-Patterns to Avoid
- **Single shared history table:** The default `flyway_schema_history` name used by all 4 services would cause all services to see each other's migrations — each service would think another's V1 is its own. Always set `quarkus.flyway.table` per service.
- **migrate-at-start=false:** Without this, Flyway connects to the DB but does nothing automatically. Always set `migrate-at-start=true` in a containerized deployment.
- **Hand-writing V1 baseline:** The locked decision is `pg_dump --schema-only`. A hand-written V1 that doesn't exactly match the live schema will cause `flyway validate` to fail — even with `baseline-on-migrate`, because validate checksums the migration files against what's recorded in the history table.
- **Setting `database.generation=none` without profile gate:** Removing `update` globally breaks local dev (developer can't start the app without a fully migrated DB). Gate to `%prod`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema baseline for existing DB | Hand-written CREATE TABLE statements | `pg_dump --schema-only` per service | Drift risk — any column added by auto-DDL (e.g., `daily_capacity_minutes`) will be missed |
| Migration history tracking | Custom table or file versioning | Flyway `flyway_schema_history_*` | Flyway handles checksums, ordering, locking, and repair |
| Schema validation before deploy | Manual SQL diff | `flyway validate` CLI against staging DB copy | Flyway compares migration file checksums against recorded history |

---

## Critical Codebase Findings

### Finding 1: Shared Single Database (HIGH impact)
All 4 services connect to identical JDBC URL: `jdbc:postgresql://anotame-db:5432/anotame`.
This is NOT multi-schema — all tables coexist in the public schema of the `anotame` database.
**Consequence:** Per-service Flyway history tables are mandatory (DB-04). Without them, concurrent startup of 4 services would produce unpredictable results.

### Finding 2: Current `database.generation=update` Has No Profile Gate
All 4 `application.properties` files have:
```properties
quarkus.hibernate-orm.database.generation=update
```
There is no `%prod.` prefix. This means auto-DDL runs in Railway production today. Phase 6 must add `%prod.quarkus.hibernate-orm.database.generation=none`.

### Finding 3: Schema Drift — operations-service
`EstablishmentJpa` maps to `tce_establishment` and has a `daily_capacity_minutes` column:
```java
@Column(name = "daily_capacity_minutes")
private Integer dailyCapacityMinutes = 480;
```
This column does NOT appear in `anotame-db/init.sql`. It was added to the live database by Hibernate auto-DDL. The `V1__baseline.sql` for operations-service MUST be generated from the live DB — not from `init.sql` — to capture this column.

### Finding 4: operations-service Has Two Auto-DDL-Only Tables
`WorkOrderJpa` maps to `tco_work_order` and `WorkOrderItemJpa` maps to `tco_work_order_item`. Neither table appears in `init.sql`. Both exist only in production because auto-DDL created them. These tables must be captured in the `pg_dump` V1 baseline for operations-service.

### Finding 5: Existing `migration.sql` Content
File: `migration.sql` at repo root.
Content: `ALTER TABLE tco_order_item ADD COLUMN IF NOT EXISTS unit_price DECIMAL(19,4) NOT NULL DEFAULT 0.0;`
The `unit_price` column is already present in `init.sql` and was applied to the live DB by auto-DDL. The `IF NOT EXISTS` guard makes this idempotent. When converted to `V2__add_unit_price_to_order_item.sql` in sales-service, it will be a no-op on existing databases — which is the correct behavior.
The file is referenced only in `docs/standardization_plan.md` comments — it has no runtime references in any application code, Docker config, or build scripts.

### Finding 6: `tco_ticket_number_seq` Sequence
`sales-service/src/main/resources/db/sequence-migration.sql` creates `tco_ticket_number_seq`. This sequence exists in the live DB (applied manually as part of Phase 3 deploy). The V1 baseline for sales-service (from `pg_dump`) will include this sequence automatically.

### Finding 7: identity-service Owns `cca_role` Table (Shared Reference)
`identity-service` maps `Role.java` to `cca_role`. `catalog-service` does NOT directly map `cca_role`. However, `init.sql` places `cca_role` before the identity context — it was conceived as a catalog/config table (prefix `cca_`). In practice, only identity-service has a JPA entity for it, so identity-service's V1 baseline should include `cca_role`.

---

## Table Ownership Per Service

This mapping determines which tables each service's `V1__baseline.sql` must include when scoping `pg_dump`:

| Service | Tables Owned (JPA entities) | Notes |
|---------|---------------------------|-------|
| **identity-service** | `tca_user`, `cca_role` | `tce_employee_assignment` read via native query (no JPA entity), not owned |
| **catalog-service** | `cci_garment_type`, `cci_service`, `tcc_price_list`, `tcc_price_list_item` | All four catalog context tables |
| **sales-service** | `tco_customer`, `tco_order`, `tco_order_history`, `tco_order_item`, `tco_order_item_service`, sequence `tco_ticket_number_seq` | `tco_order_history` present in init.sql; sequence applied in Phase 3 |
| **operations-service** | `tce_establishment`, `tce_branch`, `tce_employee_assignment`, `top_work_day`, `top_holiday`, `top_shift`, `tco_work_order`, `tco_work_order_item` | `tco_work_order` and `tco_work_order_item` are auto-DDL-only — not in init.sql |

**Important:** The `pg_dump` approach for V1 does not need to be scoped by table — the goal is a full-schema baseline that all services can share. The split-by-service table list above matters most for understanding which service OWNS each migration going forward (i.e., which service's V2+ migrations should touch which tables).

**Practical approach for V1:** Run one `pg_dump --schema-only` on the full database. Each service gets the same V1 baseline (the full schema). Flyway's `baseline-on-migrate` will stamp each service's history table at V1 and never try to execute it on the existing DB. This avoids complex per-table dump scoping.

---

## Per-Service Configuration Summary

### identity-service `application.properties` additions
```properties
# Flyway
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.baseline-version=1
quarkus.flyway.table=flyway_schema_history_identity

# Hibernate — disable auto-DDL in production
%prod.quarkus.hibernate-orm.database.generation=none
```

### catalog-service `application.properties` additions
```properties
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.baseline-version=1
quarkus.flyway.table=flyway_schema_history_catalog

%prod.quarkus.hibernate-orm.database.generation=none
```

### sales-service `application.properties` additions
```properties
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.baseline-version=1
quarkus.flyway.table=flyway_schema_history_sales

%prod.quarkus.hibernate-orm.database.generation=none
```

### operations-service `application.properties` additions
```properties
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.baseline-version=1
quarkus.flyway.table=flyway_schema_history_operations

%prod.quarkus.hibernate-orm.database.generation=none
```

---

## Common Pitfalls

### Pitfall 1: Flyway Refuses to Migrate Non-Empty Schema
**What goes wrong:** On first startup with Flyway enabled against an existing database, Flyway throws `Found non-empty schema(s) ... but no schema history table.` and refuses to proceed.
**Why it happens:** Flyway default behavior is to treat a non-empty schema without a history table as an error.
**How to avoid:** Set `quarkus.flyway.baseline-on-migrate=true` and `quarkus.flyway.baseline-version=1`. Flyway will stamp V1 as already applied and only execute V2+.
**Warning signs:** Application fails to start in production with Flyway-related exception on first deploy after Phase 6.

### Pitfall 2: Checksum Mismatch on Validate
**What goes wrong:** `flyway validate` reports a checksum mismatch after the migration file has been applied.
**Why it happens:** If the contents of `V1__baseline.sql` are modified after the history table records its checksum, Flyway detects a tamper. Also happens if line endings (CRLF vs LF) differ between environments.
**How to avoid:** Never edit a migration file after it has been applied to any environment. Ensure git is configured for LF line endings (`git config core.autocrlf false`).
**Warning signs:** `ERROR: Validate failed: Migration checksum mismatch for migration version 1`

### Pitfall 3: All 4 Services Share the History Table Name
**What goes wrong:** If all services use the default `flyway_schema_history` table, service B sees service A's V1 as already applied, then tries to run V2 without V1 context, causing ordering errors or data corruption.
**Why it happens:** Default Flyway behavior — same table name for all instances on the same schema.
**How to avoid:** Set unique `quarkus.flyway.table` values per service (DB-04 requirement).
**Warning signs:** Services report migration versions in unexpected order, or `flyway_schema_history` shows rows from multiple services interleaved.

### Pitfall 4: `pg_dump` Produces Schema Not Available at Container Startup
**What goes wrong:** The developer runs `pg_dump` against a local Docker DB that doesn't have the auto-DDL-created tables (`tco_work_order`, `tco_work_order_item`, `daily_capacity_minutes`) because the services have never started against it.
**Why it happens:** `init.sql` is the bootstrap, but auto-DDL adds columns/tables at runtime. A fresh Docker DB seeded only from `init.sql` is missing these runtime additions.
**How to avoid:** Run `pg_dump` against the **live Railway database** (which has all auto-DDL additions), not against a fresh Docker container.
**Warning signs:** V1 baseline is missing `tco_work_order` table or `daily_capacity_minutes` column; operations-service startup fails with missing table error.

### Pitfall 5: `migration.sql` V2 Tries to Add Already-Existing Column
**What goes wrong:** `V2__add_unit_price_to_order_item.sql` fails because `unit_price` already exists on `tco_order_item` in the live DB.
**Why it happens:** The column was added by auto-DDL before Phase 6.
**How to avoid:** The existing `migration.sql` uses `ADD COLUMN IF NOT EXISTS` — this guard must be preserved in the V2 file. Do not remove `IF NOT EXISTS`.
**Warning signs:** `ERROR: column "unit_price" of relation "tco_order_item" already exists` — only if `IF NOT EXISTS` is accidentally dropped.

### Pitfall 6: Staging DB Does Not Exist
**What goes wrong:** Plan 06-04 (staging validate gate) cannot execute because no staging database environment exists.
**Why it happens:** The project currently has no documented staging environment. The STATE.md blocker notes this explicitly: "Staging DB environment must exist or be provisioned before Phase 6 can execute."
**How to avoid:** Plan 06-04 must either (a) provision a staging DB (e.g., second Railway database service), or (b) define a local Docker-based staging process as a substitute.
**Warning signs:** This is a known blocker — flag it at plan creation time.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Run `anotame-db` container for `pg_dump` | Yes | 29.3.1 (desktop-linux) | — |
| `pg_dump` (local) | 06-02: generate V1 baseline | No | — | Run inside `anotame-db` container: `docker exec anotame-db pg_dump -U admin -d anotame --schema-only` |
| `pg_isready` (local) | DB health check | No | — | `docker exec anotame-db pg_isready` |
| Railway DB (production) | Source for V1 pg_dump | Unknown | — | Must use Railway CLI or Railway DB connection string; document as manual step |
| Staging DB environment | 06-04: `flyway validate` | No | — | No staging env exists — plan must provision one (Railway + new DB service) or use local Docker clone |
| `flyway` CLI (local) | 06-04: `flyway validate` | No | — | Use Flyway Docker image: `docker run flyway/flyway validate` |

**Missing dependencies with no fallback:**
- Railway staging DB — this is a prerequisite for plan 06-04 that has no automatic fallback. The planner must include provisioning a staging DB as a task in 06-04, or re-scope 06-04 as a local Docker validation substitute.

**Missing dependencies with fallback:**
- `pg_dump`: fallback is `docker exec anotame-db pg_dump ...` against a local container that has been seeded and had services started against it, OR via Railway CLI `railway connect` tunnel.
- `flyway` CLI: fallback is `docker run --rm flyway/flyway -url=... -user=... -password=... -locations=... validate`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test infrastructure exists in any service |
| Config file | None |
| Quick run command | `docker compose up --build` (integration smoke test) |
| Full suite command | `docker compose up --build` then manual endpoint verification |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DB-01 | Services start with Flyway enabled and `database.generation=none` in prod | smoke | `docker compose up --build` (all 4 services start without Hibernate DDL errors) | ❌ manual |
| DB-02 | V1 baseline exists in each service's migration dir | file check | `ls {service}/src/main/resources/db/migration/V1__baseline.sql` | ❌ Wave 0 |
| DB-03 | V2 file exists in sales-service, migration.sql absent from root | file check | `ls sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql` | ❌ Wave 0 |
| DB-04 | 4 separate history tables created in DB after startup | smoke | `docker exec anotame-db psql -U admin -d anotame -c "\dt flyway_schema_history_*"` | ❌ manual |

### Wave 0 Gaps
- [ ] Create `src/main/resources/db/migration/` directories in all 4 services (they don't exist yet)
- [ ] No test framework — all validation is smoke/manual; this is acceptable given deferred TEST-* requirements

---

## Open Questions

1. **Staging DB provisioning strategy**
   - What we know: No staging environment exists today; STATE.md flags this as a blocker for Phase 6.
   - What's unclear: Should staging be a second Railway service, or is a local Docker DB + `flyway validate` an acceptable substitute?
   - Recommendation: Define "staging validate" for Phase 6 as: spin up a fresh Docker PostgreSQL container, restore a dump from the live Railway DB using `pg_restore`, run `flyway validate` against it. This avoids Railway cost while satisfying the intent of DB-04. Document this as a manual execution step in plan 06-04.

2. **`pg_dump` access to Railway production DB**
   - What we know: `pg_dump` is not on the developer's local PATH. The live DB is on Railway.
   - What's unclear: Does the developer have Railway CLI installed? Can they run `railway connect` to tunnel to the DB?
   - Recommendation: Plan 06-02 must include instructions for both paths: (a) `railway connect` + local `pg_dump`, (b) `docker exec` against a local DB that has been fully bootstrapped by starting all 4 services at least once.

3. **operations-service `tce_employee_assignment` ownership**
   - What we know: operations-service reads from `tce_employee_assignment` via native query in `UserRepository`. Identity-service has no JPA entity for it.
   - What's unclear: Who is responsible for migrating `tce_employee_assignment`? It has a foreign key to `tca_user` (identity) and `tce_branch` (operations).
   - Recommendation: Assign `tce_employee_assignment` to operations-service (branch is the owning context; user is a reference). V1 full-schema baseline avoids this ambiguity entirely.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `hibernate.hbm2ddl.auto=update` (Spring) | `quarkus.hibernate-orm.database.generation=update` (Quarkus) | Already present | Same concept, Quarkus property name differs |
| Flyway `flyway.table` (Spring Boot) | `quarkus.flyway.table` (Quarkus) | Quarkus 1.x+ | Property prefix changes; Quarkus wraps Flyway config |
| Flyway CLI for all operations | `quarkus.flyway.migrate-at-start=true` (embedded) | Quarkus 1.x+ | Migration happens at app startup; no separate CLI needed for normal deploys |

---

## Sources

### Primary (HIGH confidence)
- [Quarkus Flyway Guide](https://quarkus.io/guides/flyway) — artifact ID, all property names, multi-datasource config, baseline-on-migrate, migrate-at-start
- Codebase direct reads — all 4 `application.properties`, all 4 `pom.xml` files, `anotame-db/init.sql`, `migration.sql`, entity files

### Secondary (MEDIUM confidence)
- [Quarkus GitHub: baseline-on-migrate test properties](https://github.com/quarkusio/quarkus/blob/main/extensions/flyway/deployment/src/test/resources/baseline-on-migrate.properties) — confirms property syntax in test fixtures

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — BOM version confirmed from all 4 pom.xml files; artifact ID confirmed from official Quarkus guide
- Architecture: HIGH — shared DB topology confirmed from application.properties; per-service table pattern confirmed from official docs
- Pitfalls: HIGH — schema drift confirmed by direct entity inspection; staging blocker confirmed from STATE.md

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (Quarkus 3.x is stable; Flyway property names change rarely)
