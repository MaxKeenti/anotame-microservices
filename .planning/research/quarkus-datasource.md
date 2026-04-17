# Quarkus 3.x Datasource + Flyway Research
# Context: anotame-microservices DB-per-service migration

**Researched:** 2026-04-14
**Quarkus version in project:** 3.27.2 (confirmed in all four service pom.xml files)
**Source basis:** Official Quarkus documentation (quarkus.io/guides/datasource, quarkus.io/guides/flyway) cross-referenced against the actual codebase. All property names verified against the running config already in use.

---

## 1. Quarkus Datasource Configuration

### How the Default Datasource Works

Quarkus uses the concept of a "default" datasource (no name qualifier) and optionally named datasources. Since each service will own exactly one database, you only ever need the default datasource. Named datasources (`quarkus.datasource."name".*`) are only relevant when a single service connects to multiple databases simultaneously — that does not apply here.

The correct property namespace for Quarkus 3.x with JDBC + Agroal:

```properties
# --- Database kind (required) ---
quarkus.datasource.db-kind=postgresql

# --- JDBC URL ---
quarkus.datasource.jdbc.url=jdbc:postgresql://<host>:<port>/<dbname>

# --- Credentials ---
quarkus.datasource.username=<user>
quarkus.datasource.password=<password>

# --- Agroal connection pool (optional, defaults shown) ---
quarkus.datasource.jdbc.min-size=1
quarkus.datasource.jdbc.max-size=20
quarkus.datasource.jdbc.acquisition-timeout=5
quarkus.datasource.jdbc.idle-removal-interval=PT5M
quarkus.datasource.jdbc.max-lifetime=PT1H
```

### What the Project Already Uses Correctly

All four services already use this exact format. The current config is correct:

```properties
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}
```

`${VAR:default}` is Quarkus's MicroProfile Config expression syntax — the colon introduces a fallback value. This is correct and idiomatic.

### Changes Needed for DB-per-service

The only change required is the JDBC URL hostname and database name per service. Example after migration:

```properties
# identity-service
quarkus.datasource.jdbc.url=jdbc:postgresql://identity-db:5432/identity

# catalog-service
quarkus.datasource.jdbc.url=jdbc:postgresql://catalog-db:5432/catalog

# sales-service
quarkus.datasource.jdbc.url=jdbc:postgresql://sales-db:5432/sales

# operations-service
quarkus.datasource.jdbc.url=jdbc:postgresql://operations-db:5432/operations
```

Use environment variable injection so the same property file works for both dev and prod:

```properties
quarkus.datasource.jdbc.url=${QUARKUS_DATASOURCE_JDBC_URL:jdbc:postgresql://localhost:5432/sales}
```

The `%dev` profile override approach (see section 4) is the cleaner pattern.

### Agroal Pool — When to Tune

The defaults (min=1, max=20) are fine for this application at its current scale. The one setting worth adding immediately is `acquisition-timeout` to avoid indefinite hangs when the DB container isn't ready yet:

```properties
quarkus.datasource.jdbc.acquisition-timeout=10
```

The JDBC health check extension (`quarkus-smallrye-health` is already in pom.xml) automatically wires a `/q/health/ready` check against the datasource — no additional configuration needed. The Docker Compose `healthcheck` entries already use this endpoint.

---

## 2. Flyway with Quarkus 3.x

### How quarkus-flyway Works

`quarkus-flyway` wraps the standard Flyway library and integrates it into the Quarkus lifecycle. Key behaviors:

- Flyway runs **before** Hibernate ORM initializes. This means the schema exists before Hibernate validates or generates DDL.
- `migrate-at-start=true` triggers migration on every application startup. Flyway is idempotent — if all migrations have already been applied it is a no-op.
- The extension automatically wires Flyway to the default datasource. For named datasources, the property namespace mirrors the datasource name: `quarkus.flyway."name".*`.

### The Properties in Detail

**Currently used in this project (confirmed correct for Quarkus 3.x):**

```properties
# Run migrations automatically on every startup
quarkus.flyway.migrate-at-start=true

# Treat existing schemas as if V1 baseline was already applied.
# Required when Flyway is introduced to a DB that already has tables
# (prevents "Found non-empty schema with no schema history table" error).
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.baseline-version=1

# Custom history table name (prevents conflicts when multiple services
# share a single database — the current shared-DB situation).
quarkus.flyway.table=flyway_schema_history_sales
```

### After Migration to DB-per-service

Once each service has its own database, the `flyway.table` customization becomes **optional**. The default table name is `flyway_schema_history` and there is no longer any risk of cross-service conflict. You can simplify to:

```properties
quarkus.flyway.migrate-at-start=true
# baseline-on-migrate is only needed if migrating a pre-existing DB.
# For fresh databases, omit it — Flyway will create the history table itself.
```

Keep `baseline-on-migrate=true` during the Railway cutover if the new databases might be pre-populated (e.g., by init.sql running before the service starts). For truly empty databases with no tables, Flyway handles everything natively without baseline.

### The `locations` Property

Default Flyway migration location is `classpath:db/migration`. The project currently uses this default — all four services have their SQL files at `src/main/resources/db/migration/`. This is correct and requires no `locations` property unless you want multiple directories.

If you ever need to point to a non-default location:

```properties
quarkus.flyway.locations=classpath:db/migration,classpath:db/seed-data
```

You can also use filesystem paths (useful for dev-only seed migrations):

```properties
%dev.quarkus.flyway.locations=classpath:db/migration,classpath:db/dev-seeds
```

### Flyway + Hibernate ORM Generation Setting

The project already has the correct pattern:

```properties
# Dev: let Hibernate auto-update DDL (fast iteration)
quarkus.hibernate-orm.database.generation=update

# Prod: Flyway owns the schema, Hibernate must not touch it
%prod.quarkus.hibernate-orm.database.generation=none
```

This is correct. In prod, `ddl-auto=none` combined with `flyway.migrate-at-start=true` means Flyway runs first and creates/updates all tables, then Hibernate connects to an already-correct schema.

**One risk with `ddl-auto=update` in dev:** Hibernate's update mode will silently add columns that aren't in migrations yet. When you later write a migration for those columns with `ADD COLUMN IF NOT EXISTS`, it works — but it makes V1 baselines stale over time. The existing V2 migration for `unit_price` documents exactly this pattern with the correct `IF NOT EXISTS` guard.

---

## 3. Fresh Baseline Strategy for DB-per-service

### The Question: Collapse V1–V4 or Replay All Four?

**Recommendation: Write a new consolidated V1 for each service's dedicated database.**

Here is the reasoning.

**Replaying V1–V4 (keeping existing migrations as-is):**
- Pro: The migration history perfectly documents the schema evolution.
- Pro: Zero new SQL to write — you already have the files.
- Con: V1 in all four services is a `pg_dump` of the entire shared database, not just that service's tables. It creates tables that don't belong to the service (e.g., the sales-service V1 currently creates `cca_role`, `cci_garment_type`, `top_shift`, etc. — tables that belong to identity, catalog, and operations respectively).
- Con: The current V1 files contain `pg_dump` header directives (`SET statement_timeout`, `SELECT pg_catalog.set_config`, `\restrict` tokens) that are noise in a migration file, not schema definition.
- Con: V2 in sales-service uses `ADD COLUMN IF NOT EXISTS` specifically because V1 was a dump of an already-modified DB — this guard becomes unnecessary if V1 is a clean baseline that already includes `unit_price`.

**New consolidated V1 per service (recommended):**
- Pro: Each service's V1 contains exactly and only the tables that service owns. Clean ownership.
- Pro: All columns from V2–V4 are folded in from day one — no incremental ALTERs needed for a fresh DB.
- Pro: Eliminates the `pg_dump` header noise and `IF NOT EXISTS` guards that exist only to handle historical drift.
- Pro: Easier to onboard new developers — "here are our tables" fits in one file.
- Con: You lose the migration history trail in Flyway's history table (but since it's a fresh DB it would start clean anyway).
- Con: Some SQL authoring work — but for these four services the schemas are well understood.

**The split: which tables belong where**

Based on inspection of V1 baselines (all four services currently dump the entire shared schema):

| Service | Owns These Tables |
|---|---|
| identity-service | `cca_role`, `tca_user` |
| catalog-service | `cci_garment_type`, `cci_service`, `tcc_price_list`, `tcc_price_list_item` |
| sales-service | `tco_customer`, `tco_order`, `tco_order_item`, `tco_order_item_service`, `tco_order_history`, `tco_order_audit_log`, `tco_work_order`, `tco_work_order_item`, `tco_ticket_number_seq` |
| operations-service | `tce_establishment`, `tce_branch`, `tce_employee_assignment`, `top_holiday`, `top_shift`, `top_work_day` |

**How to write the new V1 for each service:**

1. Write `CREATE TABLE` statements only for the tables that service owns.
2. Include all columns from all prior migrations (V2–V4 additions folded in).
3. Include `CREATE SEQUENCE` and `CREATE INDEX` statements.
4. Do NOT include `OWNER TO admin` clauses — those are pg_dump artifacts and break migrations when the DB user differs.
5. Do NOT include `SET` session parameters from pg_dump headers.
6. Use `CREATE EXTENSION IF NOT EXISTS` for citext and pgcrypto at the top.
7. Remove cross-service foreign keys — `tco_order_item.id_garment_type` references `cci_garment_type` which will no longer be in the same database. That FK must be dropped.
8. Remove `baseline-on-migrate` once the new fresh V1 is in place, since these will be brand new empty databases.

**Example new sales-service V1 structure:**

```sql
-- V1__initial_schema.sql
-- Sales service: tco_* tables + ticket sequence
-- NOTE: No cross-DB foreign keys. id_garment_type, id_service stored as plain UUIDs.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE SEQUENCE IF NOT EXISTS tco_ticket_number_seq
    START WITH 1 INCREMENT BY 1 NO CYCLE;

CREATE TABLE tco_customer (
    id_customer UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name  VARCHAR(255) NOT NULL,
    last_name   VARCHAR(255),
    phone_number VARCHAR(255),
    email       VARCHAR(255),
    preferences JSONB,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    is_deleted  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE tco_order (
    id_order          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_branch      INTEGER NOT NULL,
    id_branch         UUID NOT NULL,        -- reference to operations-service, no FK
    id_customer       UUID NOT NULL REFERENCES tco_customer(id_customer),
    created_by_user_id UUID NOT NULL,       -- reference to identity-service, no FK
    customer_snapshot JSONB,
    total_amount      NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    currency          VARCHAR(3) DEFAULT 'MXN',
    amount_paid       NUMERIC(19,4) DEFAULT 0.0,
    payment_method    VARCHAR(255),
    status            VARCHAR(255) NOT NULL,
    current_status    VARCHAR(50) DEFAULT 'RECEIVED',
    received_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    promised_at       TIMESTAMPTZ,
    delivered_at      TIMESTAMPTZ,
    committed_deadline TIMESTAMPTZ,
    pickup_code       VARCHAR(6),
    notes             VARCHAR(255),
    ticket_number     VARCHAR(255) UNIQUE,
    total_duration_min INTEGER,
    price_list_id     UUID,
    price_list_name   VARCHAR(255),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    is_deleted        BOOLEAN NOT NULL DEFAULT false
);
-- ... etc for remaining tco_* tables
```

---

## 4. init.sql for Local Dev

### Current Situation

The project has a single `anotame-db/init.sql` mounted into the PostgreSQL container via Docker Compose:

```yaml
volumes:
  - ./anotame-db/init.sql:/docker-entrypoint-initdb.d/init.sql
```

PostgreSQL's `docker-entrypoint-initdb.d` mechanism runs `*.sql` files alphabetically on first container startup (when `PGDATA` is empty). It does NOT run on subsequent starts if the data volume already exists. This is pure first-boot bootstrap — not idempotent.

The init.sql is currently 29,740 tokens (large) and creates the entire shared schema across all services.

### After DB-per-service: What init.sql Should Do

With four separate database containers, each needs its own init setup. There are two valid approaches:

**Option A: Keep init.sql, restrict to DB creation only (recommended)**

Each database container's init.sql should do the minimum:
- Create extensions (citext, pgcrypto).
- Optionally insert minimal seed data (roles, default catalog entries) that Flyway cannot insert because it manages schema, not reference data.
- Do NOT create tables — that is Flyway's job.

```sql
-- init.sql for sales-db container
-- Purpose: extensions and seed data only. Tables are managed by Flyway.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
-- No table creation here.
```

**Option B: Eliminate init.sql entirely**

Let Flyway handle everything including extensions. This is cleaner — single source of truth for schema. Add extension creation to the top of V1:

```sql
-- V1__initial_schema.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
-- ... tables below
```

This works in Railway (Flyway runs as the app user, which must have the `CREATE EXTENSION` privilege). For Railway PostgreSQL services, the default user typically has superuser or extension-creation rights. If not, init.sql is required for extensions.

**Recommendation: Option B for simplicity, with a fallback init.sql that only does extensions if Railway's user can't install them.**

### The `%dev` Profile Pattern for Local vs Prod URLs

The cleanest approach for multi-environment datasource config:

```properties
# application.properties (default — used in prod/Railway/Docker)
quarkus.datasource.jdbc.url=${QUARKUS_DATASOURCE_JDBC_URL:jdbc:postgresql://sales-db:5432/sales}
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}

# Override for local dev — points to localhost since services run outside Docker in dev mode
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5433/sales
%dev.quarkus.datasource.username=admin
%dev.quarkus.datasource.password=password
```

Quarkus activates the `%dev` profile automatically during `./mvnw quarkus:dev`. Production runs on Railway activate no profile prefix, so the base properties (with env var injection) are used. Docker Compose local runs (full stack) also use the base properties since they aren't run via `quarkus:dev`.

**Important:** The `%dev` prefix on a property takes precedence over the unprefixed version within the dev profile. You do not need `%prod` for the default URL since unprefixed properties apply to all profiles unless overridden.

### Should init.sql Mirror Flyway Migrations or Be Replaced?

init.sql and Flyway serve different moments:
- `init.sql` runs once when the Docker volume is first created (empty container).
- Flyway runs on every application startup.

If Flyway's V1 creates all tables, init.sql only needs extensions. If you keep them in sync (init.sql = tables + extensions), then any schema change must be made in two places — this creates drift risk.

**Conclusion: init.sql should be extensions-only. Tables belong to Flyway exclusively.** The current project has the opposite situation (init.sql has the full schema, Flyway V1 also has the full schema) which creates duplication. After the DB-per-service migration, consolidate into Flyway-owns-schema.

---

## 5. Cross-Service Data References

### The Problem

The shared database allowed SQL joins and foreign keys across service table boundaries. After splitting:
- `tco_order_item.id_garment_type` references `cci_garment_type` (catalog-service DB).
- `tco_order_item_service.id_service` references `cci_service` (catalog-service DB).
- `tco_order.id_branch` references `tce_branch` (operations-service DB).
- `tco_order.created_by_user_id` references `tca_user` (identity-service DB).
- The Hibernate entity relationships for these cross-service references must be removed.

None of these are currently enforced as Hibernate `@ManyToOne` with lazy loading (the current entities store UUIDs and do point lookups). This is already partially decoupled at the Java level — confirmed by the V1 baseline where cross-service FKs exist at the SQL level but are likely not reflected as Hibernate associations (given Hibernate `ddl-auto=update` would have failed to create them if the entities had `@ManyToOne` relationships pointing to tables in the same persistence unit). Verification of entity code is recommended before migration.

### Quarkus REST Client Pattern

The standard Quarkus approach for service-to-service HTTP calls is `quarkus-rest-client-reactive` (the reactive flavor) or `quarkus-rest-client` (blocking). Since the project uses `quarkus-rest-jackson` (non-reactive REST endpoints), the blocking client is the natural fit.

**Dependency to add (in pom.xml of services that need to call others):**

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-rest-client-jackson</artifactId>
</dependency>
```

**Interface definition:**

```java
@Path("/catalog")
@RegisterRestClient(configKey = "catalog-service")
public interface CatalogClient {

    @GET
    @Path("/garment-types/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    GarmentTypeDto getGarmentType(@PathParam("id") UUID id);

    @GET
    @Path("/price-lists/active")
    @Produces(MediaType.APPLICATION_JSON)
    List<PriceListDto> getActivePriceLists();
}
```

**Injection at call site:**

```java
@Inject
@RestClient
CatalogClient catalogClient;
```

**Configuration:**

```properties
# application.properties
quarkus.rest-client.catalog-service.url=http://catalog-service:8082

%dev.quarkus.rest-client.catalog-service.url=http://localhost:8082
```

The `configKey` in `@RegisterRestClient` connects the annotation to the `quarkus.rest-client.<configKey>.url` property. This is the idiomatic Quarkus pattern and avoids hardcoding URLs in Java.

### Denormalization Trade-offs

The current order model already denormalizes critical data at write time:
- `tco_order_item.garment_name` — snapshot of the garment name at order creation.
- `tco_order_item_service.service_name` — snapshot of the service name at order creation.
- `tco_order.price_list_name` — snapshot of the price list name.
- `tco_order.customer_snapshot` (JSONB) — full customer denormalization.

This pattern is already correct for microservices. The garment and service UUIDs (`id_garment_type`, `id_service`) are stored but the names are captured at write time so orders remain coherent even if the catalog changes.

**What still requires live API calls (not yet denormalized):**
- Creating a new order: need to validate that `id_garment_type` and `id_service` exist and are active in catalog-service.
- Calculating price: need to look up active price list from catalog-service at order creation time.
- Branch validation: need to verify `id_branch` is a valid branch from operations-service.

These validation calls at order creation time are acceptable — they happen once per order creation, not on every read. The pattern is: validate via HTTP at write time, store the snapshot, never re-fetch on reads.

**What to avoid:**
- Do not attempt to join across service boundaries at query time. If an order list view needs customer names, use the `customer_snapshot` JSONB column.
- Do not store a `@ManyToOne` Hibernate relationship pointing to a table in another service's DB — that relationship doesn't exist anymore and Hibernate will fail to resolve it.
- Do not create synchronous HTTP calls on the read path of high-frequency endpoints (order list, dashboard). Cache catalog data in the calling service if needed.

### Caching Catalog Data in sales-service

For catalog data (garment types, services, price lists) that changes infrequently, a simple in-memory cache is appropriate. Quarkus 3.x includes `quarkus-cache` (backed by Caffeine):

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-cache</artifactId>
</dependency>
```

```java
@CacheResult(cacheName = "garment-types")
public GarmentTypeDto getGarmentType(UUID id) {
    return catalogClient.getGarmentType(id);
}
```

Cache invalidation on catalog changes can be done via TTL (acceptable for this use case — stale data for seconds/minutes is fine for garment type names) or via a webhook/event if catalog publishes change notifications.

---

## 6. Known Pitfalls for This Migration

### The `baseline-on-migrate` Trap

`baseline-on-migrate=true` + `baseline-version=1` tells Flyway: "if the schema history table doesn't exist but the schema does, create the history table and mark V1 as already applied." This was necessary for the shared database where V1 was introduced after tables existed via `ddl-auto=update`.

For fresh databases (new empty PostgreSQL containers), you do NOT want `baseline-on-migrate=true`. If set, Flyway will silently skip V1 and start applying from V2. On a fresh DB with no tables, V2 (`ALTER TABLE tco_order_item ADD COLUMN ...`) will fail because the table doesn't exist.

**Rule:** Remove `baseline-on-migrate` once you switch to fresh databases with clean V1 baselines.

### The pg_dump `\restrict` Directive

The current V1 files contain `\restrict` and `\unrestrict` tokens. These are psql-specific directives, not standard SQL. Flyway executes SQL via JDBC, not via psql, so these lines are silently ignored — but they make the migration files non-standard and confusing. New baseline migrations should not include them.

### The `OWNER TO admin` Problem

`ALTER TABLE ... OWNER TO admin` fails if the database user running Flyway is not `admin` and is not a superuser. Railway PostgreSQL services create a user that is typically not named `admin`. New V1 migrations must omit ownership clauses.

### Cross-Service FK Removal

If any current Hibernate entity has a `@ManyToOne` or `@OneToMany` relationship pointing to a table that will move to a different service's DB, Hibernate startup will fail when it tries to validate the schema. These relationships must be converted to plain `UUID` fields before the DB split.

Based on the entity structure visible through the migration files, the cross-service references are:
- `tco_order_item.id_garment_type` — plain UUID in SQL, likely plain field in Java.
- `tco_order_item_service.id_service` — plain UUID in SQL.
- `tco_order.id_branch` — plain UUID in SQL.
- `tca_user.id_role` — within identity-service (stays in same DB, no issue).

Verify entity classes for `@JoinColumn` annotations before migrating.

### Flyway Checksum Failures

If you replace V1 with a new consolidated baseline file, Flyway will detect a checksum mismatch against any existing Flyway history table. For fresh databases this is not an issue. For any existing database (Railway) being re-pointed to a new DB, this is not an issue either since the history table starts empty. The only danger is if you modify an existing migration file in-place for a database that has already applied it.

**Rule:** Never edit a migration file that has been applied to any environment. Add new migration files instead.
