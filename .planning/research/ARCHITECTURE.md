# Architecture: Flyway Migration Strategy

**Domain:** Quarkus 3.27.2 microservices — schema management migration
**Researched:** 2026-03-31
**Confidence:** HIGH (Quarkus 3.x + Flyway 9/10 is stable, well-documented)

---

## Context

- 4 services: identity-service (8081), catalog-service (8082), sales-service (8083), operations-service (8084)
- Single PostgreSQL 16 database (`anotame`), all 4 services share it
- Table prefix separation: `tca_`/`cca_` (identity), `tcc_`/`cci_` (catalog), `tco_` (sales), `tco_`/`top_`/`tce_` (operations)
- Currently `quarkus.hibernate-orm.database.generation=update` on all 4 services
- One live client with production data — schema already exists
- Existing `migration.sql` at repo root (adds `unit_price` column to `tco_order_item`)

---

## 1. Extension Setup

Add `quarkus-flyway` to each service's `pom.xml`. No version needed — managed by the Quarkus BOM at `3.27.2`.

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-flyway</artifactId>
</dependency>
```

Flyway runs automatically at startup before Hibernate initializes, so schema is always current before ORM touches it.

---

## 2. Migration File Location

By default, Quarkus Flyway looks for migration scripts at:

```
src/main/resources/db/migration/
```

Files must follow the naming convention:

```
V{version}__{description}.sql
  ^                ^
  integer or       double underscore
  dotted version
```

Examples:
```
V1__initial_schema.sql
V2__add_unit_price_to_order_item.sql
V3__add_index_customer_email.sql
```

The double underscore (`__`) is mandatory. The description becomes the `description` field in `flyway_schema_history`.

---

## 3. Recommended Properties Per Service

Replace `quarkus.hibernate-orm.database.generation=update` with `none` and add Flyway config.

### identity-service

```properties
# Disable Hibernate DDL management
quarkus.hibernate-orm.database.generation=none

# Flyway — enabled, baseline for existing DB
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.baseline-version=1
quarkus.flyway.locations=classpath:db/migration
```

Apply the same four properties to catalog-service, sales-service, and operations-service identically. Each service discovers only its own `src/main/resources/db/migration/` classpath, so there is no cross-contamination.

---

## 4. Multi-Service Strategy: Separate Histories, One DB

### The core problem

Flyway stores its migration history in a `flyway_schema_history` table. With a single DB and 4 services, all 4 services would try to write to and read from the same table by default. This causes:

- Version conflicts (all services try to apply "V1")
- Incorrect out-of-order detection (service A's V2 appears to precede service B's V2)
- Locking contention at startup when all 4 services boot simultaneously

### Recommended solution: per-service history table

Configure each service to use a distinct `flyway_schema_history` table name:

```properties
# identity-service
quarkus.flyway.table=flyway_schema_history_identity

# catalog-service
quarkus.flyway.table=flyway_schema_history_catalog

# sales-service
quarkus.flyway.table=flyway_schema_history_sales

# operations-service
quarkus.flyway.table=flyway_schema_history_operations
```

This means each service has an independent migration version sequence starting at V1. Service versioning is isolated — sales-service can be at V5 while identity-service is at V2 with no conflict.

Do NOT use PostgreSQL schemas (search_path isolation) as the separation mechanism. The project already uses table-prefix separation within the default `public` schema, and adding schema routing would require datasource reconfiguration with no benefit.

---

## 5. Baseline Migration for Existing Production DB

`baseline-on-migrate=true` tells Flyway: "if the `flyway_schema_history` table does not exist, create it and mark the current DB state as version `baseline-version` (1) without running V1."

This is the correct approach for an existing database with live data. It means:

- V1 is treated as "already applied" — Flyway skips it on first run
- V2 and later are applied normally going forward
- No data is touched; Flyway only inserts a row into its history table

### V1 file must still exist

Even though V1 is skipped on the first run (due to baseline), the file **must be present** in `db/migration/`. Flyway validates checksums of all migrations. If V1 is absent, future fresh installs (dev environments, staging resets) will fail because Flyway cannot verify the baseline.

V1 should contain the complete `CREATE TABLE` DDL for the service's tables, matching the schema already in production. Use `CREATE TABLE IF NOT EXISTS` to make it safe.

---

## 6. Migration File Layout Per Service

```
identity-service/src/main/resources/
  db/migration/
    V1__initial_schema.sql        ← CREATE TABLE tca_user, cca_role (full DDL)
    V2__add_...sql                ← future changes only

catalog-service/src/main/resources/
  db/migration/
    V1__initial_schema.sql        ← CREATE TABLE cci_service, cci_garment_type,
                                     tcc_price_list, tcc_price_list_item

sales-service/src/main/resources/
  db/migration/
    V1__initial_schema.sql        ← CREATE TABLE tco_customer, tco_order,
                                     tco_order_item, tco_order_item_service
    V2__add_unit_price_to_order_item.sql  ← contents of existing migration.sql

operations-service/src/main/resources/
  db/migration/
    V1__initial_schema.sql        ← CREATE TABLE tco_work_order, tco_work_order_item,
                                     top_work_day, top_shift, top_holiday,
                                     tce_establishment
```

The existing `migration.sql` at the repo root maps to `sales-service` V2, since it modifies `tco_order_item`. Move its content verbatim — the `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` syntax is already safe for re-runs.

---

## 7. How to Generate V1 DDL

Do not write V1 by hand. Extract it from the live production database:

```bash
pg_dump \
  --schema-only \
  --no-owner \
  --no-acl \
  --table "tca_user" \
  --table "cca_role" \
  -h <host> -U admin anotame \
  > identity-service/src/main/resources/db/migration/V1__initial_schema.sql
```

Run a separate dump per service using the table names owned by that service. Post-process the output to replace `CREATE TABLE` with `CREATE TABLE IF NOT EXISTS` — this ensures idempotency for fresh environment setup.

---

## 8. Startup Ordering and Race Conditions

All 4 services start independently and each runs Flyway on startup. Since they write to separate history tables and own non-overlapping table prefixes, concurrent startup is safe. There is no cross-service DDL dependency.

However: if services share a foreign-key reference across prefixes (e.g., operations tables referencing catalog tables), ensure the referenced service starts and completes its migration first. In this codebase, no cross-prefix FK constraints were found in the entity code — each service uses its own prefix independently.

---

## 9. Dev Profile Override

During development, it is acceptable to use `drop-and-create` for fast iteration. Isolate this with a `%dev` profile override:

```properties
# Disable Flyway in dev, allow Hibernate to recreate
%dev.quarkus.flyway.enabled=false
%dev.quarkus.hibernate-orm.database.generation=drop-and-create
```

In production and staging (`%prod`), Flyway is always active and Hibernate DDL is `none`.

---

## 10. Best Practices for Additive Changes

- Every schema change after V1 gets its own versioned file (V2, V3, V4...)
- Never modify a migration file that has already been applied — Flyway stores its checksum and will fail on checksum mismatch
- Prefer additive changes: `ADD COLUMN`, `CREATE INDEX`, `CREATE TABLE`
- Destructive changes (`DROP COLUMN`, `DROP TABLE`) require coordination: ensure no service code references the dropped object before the migration runs
- For column renames: add the new column (V_n), backfill data (V_n+1 or application logic), drop the old column only after all services are updated (V_n+2)
- Use `IF NOT EXISTS` / `IF EXISTS` guards wherever possible to make scripts re-runnable in edge-case recovery scenarios

---

## Component Boundaries

| Service | Table Prefixes | Flyway History Table | Migration Path |
|---------|---------------|---------------------|----------------|
| identity-service | `tca_`, `cca_` | `flyway_schema_history_identity` | `db/migration/` |
| catalog-service | `tcc_`, `cci_` | `flyway_schema_history_catalog` | `db/migration/` |
| sales-service | `tco_` (orders) | `flyway_schema_history_sales` | `db/migration/` |
| operations-service | `tco_` (work orders), `top_`, `tce_` | `flyway_schema_history_operations` | `db/migration/` |

Note: `tco_` prefix is shared between sales-service and operations-service. Each service owns disjoint tables under that prefix (`tco_order*` vs `tco_work_order*`). Flyway per-service isolation handles this correctly since each service's V1 only declares its own tables.

---

## Sources

- Quarkus Flyway guide (quarkus.io/guides/flyway) — HIGH confidence, core extension docs
- Flyway documentation on baseline (flywaydb.org/documentation/command/baseline) — HIGH confidence
- `quarkus.flyway.table` property confirmed in Quarkus config reference — HIGH confidence
- Table ownership derived from `@Table` annotations in this codebase — verified directly
