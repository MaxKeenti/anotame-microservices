# Database Ownership Boundaries and Schema Strategy
# Shared-to-Independent Database Migration

**Project:** anotame-microservices
**Date:** 2026-04-14
**Scope:** Schema inventory, ownership assignments, cross-service references, PostGIS removal, fresh V1 baseline strategy

---

## 1. Current Schema Inventory

All four services share a single PostgreSQL database (`anotame`) today. Every service's V1 migration is an identical full-schema pg_dump that creates **all** tables in the shared DB. Each service relies on its own Flyway history table (`flyway_schema_history_{service}`) to avoid conflicts with the other services' migration runs, but only one copy of each table is actually created at the DB level (the first service to start wins; the others hit `IF NOT EXISTS` guards or FK satisfaction and silently pass).

### Tables by logical context (as coded in init.sql and Java @Table annotations)

#### identity-service
| Table | Primary Key | Notes |
|-------|-------------|-------|
| `cca_role` | `id_role` UUID | Referenced by `tca_user` |
| `tca_user` | `id_user` UUID | Auth users |

Java entities: `Role.java` → `cca_role`, `User.java` → `tca_user`.

#### catalog-service
| Table | Primary Key | Notes |
|-------|-------------|-------|
| `cci_garment_type` | `id_garment_type` UUID | |
| `cci_service` | `id_service` UUID | FK → `cci_garment_type` |
| `tcc_price_list` | `id_price_list` UUID | |
| `tcc_price_list_item` | `id_price_list_item` UUID | FK → `tcc_price_list`, FK → `cci_service` |

Java entities: `GarmentType.java` → `cci_garment_type`, `Service.java` → `cci_service`, `PriceList.java` → `tcc_price_list`, `PriceListItem.java` → `tcc_price_list_item`.

#### sales-service
| Table | Primary Key | Notes |
|-------|-------------|-------|
| `tco_customer` | `id_customer` UUID | |
| `tco_order` | `id_order` UUID | FK → `tco_customer`, bare UUID `id_branch` (cross-boundary), bare UUID `price_list_id` (cross-boundary) |
| `tco_order_item` | `id_order_item` UUID | FK → `tco_order`, bare UUID `id_garment_type` (cross-boundary) |
| `tco_order_item_service` | `id_item_service` UUID | FK → `tco_order_item`, bare UUID `id_service` (cross-boundary) |
| `tco_order_history` | `id_history` UUID | FK → `tco_order` (cascade delete) |
| `tco_order_audit_log` | `id_audit` UUID | FK → `tco_order` (cascade delete) — added V3 |

Java entities: `CustomerEntity.java`, `OrderEntity.java`, `OrderItemEntity.java`, `OrderItemServiceEntity.java`, `OrderAuditLogEntity.java`.

Sequence also owned by sales: `tco_ticket_number_seq` (appended to V1 baseline, used for collision-free ticket numbers).

#### operations-service
| Table | Primary Key | Notes |
|-------|-------------|-------|
| `tce_establishment` | `id_establishment` UUID | |
| `tce_branch` | `id_branch` UUID | FK → `tce_establishment` |
| `tce_employee_assignment` | `id_assignment` UUID | FK → `tce_branch`, FK → `tca_user` (cross-boundary) |
| `top_shift` | `id_shift` UUID | FK → `tca_user` (cross-boundary) |
| `top_work_day` | `id_work_day` UUID | Establishment-global schedule config |
| `top_holiday` | `id_holiday` UUID | |
| `tco_work_order` | `id_work_order` UUID | bare UUID `id_order` (cross-boundary to sales) |
| `tco_work_order_item` | `id_work_order_item` UUID | FK → `tco_work_order`, bare UUID `id_sales_order_item` (cross-boundary) |

Java entities: `EstablishmentJpa.java` → `tce_establishment`, `WorkOrderJpa.java` → `tco_work_order`, `WorkOrderItemJpa.java` → `tco_work_order_item`, `WorkShiftJpa.java` → `top_shift`, `WorkDayJpa.java` → `top_work_day`, `HolidayJpa.java` → `top_holiday`.

Note: operations-service entity `WorkOrderJpa` has field `salesOrderId` mapped to column `id_order` — it stores the UUID of a sales-service order by value only (no ORM join to any Order entity).

### Ambiguous tables

`tce_branch` and `tce_establishment` appear in **both** operations-service V1 migration SQL **and** identity-service V1 migration SQL (both dumps are full-schema dumps — every service's V1 creates the entire shared DB). However, the Java `@Table` entities tell the true story:
- `tce_establishment` and `tce_branch` are mapped only in `operations-service` Java code.
- `identity-service` has no Java entity for either of these tables even though its V1 SQL creates them.
- **Verdict:** `tce_branch` and `tce_establishment` belong to **operations-service**.

`tco_work_order` / `tco_work_order_item` appear in every service's full-dump V1 SQL. Java entities exist only in `operations-service`. **Verdict:** these tables belong to operations-service.

The "phantom" tables in each service's V1 SQL are an artifact of how pg_dump was used to generate baselines — the dump captured the full shared DB rather than per-service subsets.

---

## 2. Proposed Ownership Boundaries (Independent DBs)

Each service gets its own PostgreSQL instance/database. No table is shared.

### identity-service DB
- `cca_role`
- `tca_user`

### catalog-service DB
- `cci_garment_type`
- `cci_service`
- `tcc_price_list`
- `tcc_price_list_item`

### sales-service DB
- `tco_customer`
- `tco_order`
- `tco_order_item`
- `tco_order_item_service`
- `tco_order_history`
- `tco_order_audit_log`
- sequence: `tco_ticket_number_seq`

### operations-service DB
- `tce_establishment`
- `tce_branch`
- `tce_employee_assignment`
- `top_shift`
- `top_work_day`
- `top_holiday`
- `tco_work_order`
- `tco_work_order_item`

---

## 3. Cross-Service References

### Existing FK constraints that become invalid at DB boundaries

The shared-DB FK constraints listed in the V1 migrations are DB-level SQL FKs enforced by PostgreSQL. With independent databases they cannot exist. Every one of the cross-boundary FKs below must be **dropped from the fresh V1 SQL** and replaced with the pattern described.

#### sales-service → identity-service

| Column | Table | Old FK | Status | Resolution |
|--------|-------|--------|--------|------------|
| `created_by_user_id` | `tco_order` | None declared in SQL; column is bare UUID | Already denormalized | Keep as bare UUID column. No FK to add. |
| `changed_by_user_id` | `tco_order_history` | None declared | Already denormalized | Keep as bare UUID column. |
| `user_id` | `tco_order_audit_log` | None declared | Already denormalized | Keep as bare UUID column. |

All user-identity references in sales-service are **already bare UUID columns with no DB-level FK**. No action needed beyond removing the identity tables from the sales-service V1 SQL.

#### sales-service → catalog-service (the key problem area)

| Column | Table | Old SQL FK | Java mapping | Current state | Resolution |
|--------|-------|-----------|--------------|---------------|------------|
| `id_garment_type` | `tco_order_item` | `FOREIGN KEY (id_garment_type) REFERENCES cci_garment_type(id_garment_type)` | `@Column(name = "id_garment_type")` — no `@ManyToOne` | Mixed: DB FK exists, Java does NOT use a JPA join | Drop the DB FK. The column stores a bare UUID. The denormalized `garment_name VARCHAR(255)` column on the same row already captures the display value at order time. No HTTP call needed at read time. |
| `id_service` | `tco_order_item_service` | `FOREIGN KEY (id_service) REFERENCES cci_service(id_service)` | `@Column(name = "id_service")` — no `@ManyToOne` | Same as above | Drop the DB FK. `service_name VARCHAR(255)` already captures the snapshot. |
| `price_list_id` | `tco_order` | None (V4 added both columns nullable) | Not reflected in entity java (V4 is very recent) | No DB FK, nullable column | No action. Already a denormalized UUID + name pair (`price_list_id UUID`, `price_list_name VARCHAR(255)`). |

**Current state of catalog references in sales-service:**

The situation is actually already mostly handled by denormalization. The Java ORM layer never joins across to catalog tables — it stores bare UUIDs. The DB-level FKs (`tco_order_item.id_garment_type → cci_garment_type` and `tco_order_item_service.id_service → cci_service`) exist only in the full-dump V1 SQL. They work today only because all tables are in the same shared DB. These two FK constraints are the **only actual cross-boundary DB FKs** that exist.

**Resolution:** Write-time (order creation) requires an HTTP call to catalog-service to resolve service name, garment name, and unit price — this call is presumably already happening at the application layer since the Java entities don't JPA-join across. The names are then stored as string snapshots on the row. Once written, the order is self-contained. No catalog-service lookup is needed to read an existing order.

#### sales-service → operations-service (branch)

| Column | Table | Old SQL FK | Resolution |
|--------|-------|-----------|------------|
| `id_branch` | `tco_order` | `FOREIGN KEY (id_branch) REFERENCES tce_branch(id_branch)` | Drop the DB FK. Keep as bare UUID. At order creation, sales-service calls identity/operations via HTTP to validate the branch. The UUID is stored for routing/filtering only. |

#### operations-service → identity-service

| Column | Table | Old SQL FK | Resolution |
|--------|-------|-----------|------------|
| `id_user` in `tce_employee_assignment` | `tce_employee_assignment` | `FOREIGN KEY (id_user) REFERENCES tca_user(id_user)` | Drop the DB FK. Keep as bare UUID. |
| `id_user` in `top_shift` | `top_shift` | `FOREIGN KEY (id_user) REFERENCES tca_user(id_user)` | Drop the DB FK. Keep as bare UUID. |

#### operations-service → sales-service

| Column | Table | Old SQL FK | Java field | Resolution |
|--------|-------|-----------|-----------|------------|
| `id_order` | `tco_work_order` | None in SQL (no FK declared) | `salesOrderId UUID` bare column | Already no DB FK. No action. |
| `id_sales_order_item` | `tco_work_order_item` | None in SQL | bare UUID column | Already no DB FK. No action. |

### Summary: FKs to drop for independent databases

Three DB-level FK constraints must be removed from fresh V1 SQL:
1. `tco_order_item_service.id_service → cci_service(id_service)` — drop, replace with bare UUID + denormalized `service_name`
2. `tco_order_item.id_garment_type → cci_garment_type(id_garment_type)` — drop, replace with bare UUID + denormalized `garment_name`
3. `tco_order.id_branch → tce_branch(id_branch)` — drop, replace with bare UUID

FKs within the same service boundary remain intact (e.g., `tco_order_item → tco_order`, `tcc_price_list_item → tcc_price_list`, `tca_user → cca_role`).

### Denormalization completeness assessment

| Cross-boundary value | Snapshot column exists? | Status |
|----------------------|------------------------|--------|
| garment name at order time | `tco_order_item.garment_name VARCHAR(255)` | Complete — already denormalized |
| service name at order line time | `tco_order_item_service.service_name VARCHAR(255)` | Complete — already denormalized |
| unit price at order line time | `tco_order_item_service.unit_price DECIMAL(19,4)` | Complete — snapshot baked in |
| price list name at order time | `tco_order.price_list_name VARCHAR(255)` | Complete — V4 added this column |
| branch name/info at order time | No snapshot column on `tco_order` | **Gap** — `id_branch` UUID stored, but branch name/timezone not snapshotted. Read-time display requires HTTP call to operations-service OR a branch_name column should be added to `tco_order`. |
| customer name at order time | `tco_order.customer_snapshot JSONB` | Complete — full snapshot stored |

The branch name gap is a minor omission but worth flagging. Since orders display "received at branch X" in the UI, sales-service either calls operations-service at read time (adds latency + coupling) or a `branch_name VARCHAR(150)` snapshot column should be added to `tco_order`.

---

## 4. PostGIS Removal

### POM files: PostGIS is not present anywhere

Checked all four service POM files (`catalog-service/pom.xml`, `identity-service/pom.xml`, `sales-service/pom.xml`, `operations-service/pom.xml`). **None of them contain a PostGIS dependency.** All four use only:
- `quarkus-hibernate-orm-panache`
- `quarkus-jdbc-postgresql`
- `quarkus-flyway`

There is no `hibernate-spatial`, `postgis-jdbc`, `net.postgis:postgis-jdbc`, or any geometry type in any POM. The PostGIS references in project docs (`README.md`, `docker-compose.yml` comment, `docs/walkthrough.md`) are documentation-only artifacts describing the database Docker image as "PostGIS-capable." They do not reflect actual usage.

### Docker image: already switched away from PostGIS

`anotame-db/Dockerfile` uses `FROM postgres:16-alpine` — the vanilla PostgreSQL Alpine image, not `postgis/postgis`. `docker-compose.yml` confirms: `image: postgres:16-alpine`. No PostGIS image is in use.

### Migration SQL files: no PostGIS extension

Checked all migration SQL files across all four services. The only `CREATE EXTENSION` statements are:
```sql
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
```

There is **no** `CREATE EXTENSION postgis` in any migration file. `init.sql` in `anotame-db` also uses only `pgcrypto` and `citext`.

### Conclusion on PostGIS

PostGIS is a **dead reference in documentation only**. There is nothing to remove from code or SQL. The `ROADMAP.md` and `PROJECT.md` items tracking "PostGIS removal from catalog-service POM" are already done — they were either never added or were previously cleaned up. The task can be closed as a no-op. The `tce_branch` table stores location as `latitude DOUBLE PRECISION` and `longitude DOUBLE PRECISION` columns — plain floats, no geometry type, no PostGIS dependency.

**Action required:** Update `.planning/PROJECT.md` and `ROADMAP.md` to mark the PostGIS removal task as complete.

---

## 5. Fresh V1 Baseline Strategy

### Problem with current V1 files

The existing `V1__baseline.sql` in each service is a pg_dump of the **entire shared database** — all 17 tables appear in every service's V1. This is wrong for independent databases. Each service's V1 must create **only its own tables**.

### Recommendation: single comprehensive V1 per service, not replayed sequence

**Write one clean V1 per service** that creates all tables the service owns in their final state (incorporating all changes made by V2–V4). Do not replay V1 → V2 → V3 → V4 as separate migrations. The reasoning:

1. This is a clean-slate migration with no live data to preserve. There is no upgrade path to honour.
2. Replaying the historical sequence would require each incremental migration to also create "clean" versions of tables that only partially existed at V1 time, which complicates the SQL and adds risk of contradictions (e.g., V1 creates `tco_order_item` without `unit_price`, then V2 adds it — but on a fresh DB with IF NOT EXISTS guards, V2's ALTER TABLE may fail or be a no-op depending on DDL order).
3. A single consolidated V1 is simpler to audit, test, and reason about.
4. The incremental migrations (V2, V3, V4) represent historical changes made to a shared DB that no longer exists. Their purpose is fulfilled; their DDL is baked into the current column set.

Each fresh V1 should also:
- Include only `CREATE EXTENSION` statements that are actually used by that service's tables.
- Omit the pg_dump preamble (`SET statement_timeout`, `\restrict`/`\unrestrict` directives, `SELECT pg_catalog.set_config`, etc.) — these are pg_dump artifacts and are unnecessary in Flyway migrations.
- Include all indexes and constraints.
- Drop all cross-boundary FK constraints.

### What each fresh V1 should contain

#### identity-service V1__baseline.sql (final state)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

CREATE TABLE cca_role (
    id_role UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tca_user (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_role UUID NOT NULL REFERENCES cca_role(id_role),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);
```

No incremental migrations existed for identity-service.

#### catalog-service V1__baseline.sql (final state)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE cci_garment_type ( ... );
CREATE TABLE cci_service (
    ...
    id_garment_type UUID REFERENCES cci_garment_type(id_garment_type),  -- intra-service FK: keep
    ...
);
CREATE TABLE tcc_price_list ( ... );
CREATE TABLE tcc_price_list_item (
    ...
    id_price_list UUID NOT NULL REFERENCES tcc_price_list(id_price_list),  -- intra-service FK: keep
    id_service UUID NOT NULL REFERENCES cci_service(id_service),           -- intra-service FK: keep
    ...
);
```

No incremental migrations existed for catalog-service. `citext` is used by neither catalog table — include only `pgcrypto` (used for `gen_random_uuid()`). Actually `gen_random_uuid()` comes from `pgcrypto`. Include it. Omit `citext` unless a catalog column needs case-insensitive comparison (none currently do).

#### sales-service V1__baseline.sql (final state)

Incorporates changes from V2 (`unit_price` on `tco_order_item`), V3 (`pickup_code` on `tco_order`, `tco_order_audit_log` table), V4 (`price_list_id` and `price_list_name` on `tco_order`). Drops three cross-boundary FKs.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE SEQUENCE tco_ticket_number_seq START WITH 1 INCREMENT BY 1 NO CYCLE;

CREATE TABLE tco_customer ( ... );

CREATE TABLE tco_order (
    id_order UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_branch INTEGER NOT NULL,
    id_branch UUID NOT NULL,              -- bare UUID, no FK (operations-service owns tce_branch)
    id_customer UUID NOT NULL REFERENCES tco_customer(id_customer),  -- intra-service: keep
    created_by_user_id UUID NOT NULL,     -- bare UUID, no FK (identity-service owns tca_user)
    customer_snapshot JSONB,
    total_amount DECIMAL(19,4) DEFAULT 0.0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    amount_paid DECIMAL(19,4) DEFAULT 0.0,
    payment_method VARCHAR(255),
    current_status VARCHAR(50) DEFAULT 'RECEIVED',
    status VARCHAR(255) NOT NULL,
    ticket_number VARCHAR(255) UNIQUE,
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    promised_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    committed_deadline TIMESTAMPTZ,
    pickup_code VARCHAR(6),               -- added V3
    price_list_id UUID,                   -- added V4, bare UUID
    price_list_name VARCHAR(255),         -- added V4
    notes VARCHAR(255),
    total_duration_min INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tco_order_item (
    id_order_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    id_garment_type UUID NOT NULL,        -- bare UUID, no FK (catalog-service owns cci_garment_type)
    garment_name VARCHAR(255),            -- denormalized snapshot
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price DECIMAL(19,4) DEFAULT 0.0 NOT NULL,  -- added V2
    subtotal DECIMAL(19,4) NOT NULL,
    notes VARCHAR(255),
    item_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tco_order_item_service (
    id_item_service UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order_item UUID NOT NULL REFERENCES tco_order_item(id_order_item) ON DELETE CASCADE,
    id_service UUID NOT NULL,             -- bare UUID, no FK (catalog-service owns cci_service)
    service_name VARCHAR(255),            -- denormalized snapshot
    unit_price DECIMAL(19,4) NOT NULL,
    adjustment_amount DECIMAL(19,4) DEFAULT 0.0,
    adjustment_reason VARCHAR(255),
    duration_min INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tco_order_history (
    id_history UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id UUID,             -- bare UUID, no FK
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tco_order_audit_log (      -- added V3
    id_audit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    user_id UUID NOT NULL,              -- bare UUID, no FK
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_order_customer ON tco_order(id_customer);
CREATE INDEX idx_order_status ON tco_order(current_status);
CREATE INDEX idx_order_history_order ON tco_order_history(id_order);
CREATE INDEX idx_audit_order ON tco_order_audit_log(id_order);
```

#### operations-service V1__baseline.sql (final state)

Incorporates V2 (`primary_color` and `font_family` on `tce_establishment`). Drops FKs to `tca_user`.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE tce_establishment (
    id_establishment UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_info JSONB,
    owner_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    daily_capacity_minutes INTEGER,
    primary_color VARCHAR(7),      -- added V2
    font_family VARCHAR(32),       -- added V2
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE tce_branch (
    id_branch UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_establishment UUID NOT NULL REFERENCES tce_establishment(id_establishment),  -- intra-service: keep
    name VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE tce_employee_assignment (
    id_assignment UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL,              -- bare UUID, no FK (identity-service owns tca_user)
    id_branch UUID NOT NULL REFERENCES tce_branch(id_branch),  -- intra-service: keep
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (id_user, id_branch)
);

CREATE TABLE top_work_day (
    id_work_day UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL UNIQUE,
    is_open BOOLEAN DEFAULT TRUE NOT NULL,
    open_time TIME DEFAULT '09:00:00',
    close_time TIME DEFAULT '18:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT top_work_day_day_of_week_check CHECK (day_of_week >= 1 AND day_of_week <= 7)
);

CREATE TABLE top_holiday (
    id_holiday UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE top_shift (
    id_shift UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL,              -- bare UUID, no FK (identity-service owns tca_user)
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT top_shift_day_of_week_check CHECK (day_of_week >= 1 AND day_of_week <= 7)
);

CREATE TABLE tco_work_order (
    id_work_order UUID PRIMARY KEY,
    id_order UUID NOT NULL,             -- bare UUID, no FK (sales-service owns tco_order)
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tco_work_order_item (
    id_work_order_item UUID PRIMARY KEY,
    id_work_order UUID NOT NULL REFERENCES tco_work_order(id_work_order),  -- intra-service: keep
    id_sales_order_item UUID NOT NULL,  -- bare UUID, no FK
    service_name VARCHAR(255) NOT NULL, -- denormalized snapshot
    current_stage VARCHAR(255) NOT NULL,
    notes VARCHAR(255)
);
```

---

## 6. Additional Issues Found

### V1 SQL contains pg_dump noise that Flyway should not see

Every current `V1__baseline.sql` begins with:
```
\restrict WrtgHEoPzpjOQzb4HSkB9d09E5xnTKh248T9t3ObgkLgsENsY3tuIx2zMVR7Prb
```
and ends with:
```
\unrestrict WrtgHEoPzpjOQzb4HSkB9d09E5xnTKh248T9t3ObgkLgsENsY3tuIx2zMVR7Prb
```
These are psql meta-commands. Whether Flyway ignores or chokes on them depends on the JDBC driver / Flyway version. They must be removed from the fresh V1 files. The pg_dump session SET statements (`SET statement_timeout = 0`, `SET lock_timeout`, etc.) are also unnecessary and should be omitted.

### `tco_work_order.created_at` type mismatch between services

In the sales-service and catalog/identity V1 dump, `tco_work_order.created_at` is declared as `timestamp(6) without time zone`. In the operations-service V1 it is `timestamp with time zone DEFAULT NOW() NOT NULL`. The operations-service definition is authoritative (it owns the table) and is the better choice. Use `TIMESTAMPTZ` in the fresh operations-service V1.

### `tco_order` has two status columns

`tco_order` has both `current_status VARCHAR(50)` and `status VARCHAR(255)`. This appears to be a historical anomaly — `current_status` was in the original schema and `status` was added by Hibernate auto-DDL. Both exist in the current table. The fresh V1 should preserve both to match the Java entity, unless the roadmap includes a column consolidation task.

### `tce_employee_assignment` owns identity-crossing `id_branch`

`tce_employee_assignment` lives in operations-service and has FK → `tce_branch` (intra-service, keep) and bare UUID `id_user` (cross-service to identity, bare). This is correctly modelled — no action beyond dropping the `tca_user` FK in the fresh SQL.

### Application properties must be updated per service

Each service's `application.properties` currently points at:
```
quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame
```

After migration to independent databases, each service needs its own URL pointing at its own PostgreSQL instance. The `flyway.table` setting (`flyway_schema_history_catalog`, `flyway_schema_history_sales`, etc.) can revert to the Flyway default `flyway_schema_history` now that each service has its own database — there is no longer a need for per-service history table names to avoid collisions. Keeping the custom names is still valid and avoids any future confusion if schemas are ever consolidated again; this is a preference call.

---

## 7. Summary of Required Changes for Each Service

| Service | V1 action | Drop FKs | Incremental changes to fold in |
|---------|-----------|----------|-------------------------------|
| identity-service | Rewrite V1 with only `cca_role` + `tca_user` | None to drop | None (no V2+) |
| catalog-service | Rewrite V1 with only 4 catalog tables | None to drop (all intra-service) | None (no V2+) |
| sales-service | Rewrite V1 folding in V2+V3+V4 | Drop 3 FKs: `id_garment_type`, `id_service`, `id_branch` | `unit_price` (V2), `pickup_code` + `tco_order_audit_log` (V3), `price_list_id` + `price_list_name` (V4) |
| operations-service | Rewrite V1 folding in V2 | Drop 2 FKs: `top_shift.id_user`, `tce_employee_assignment.id_user` | `primary_color` + `font_family` on `tce_establishment` (V2) |

After writing fresh V1 files, delete the old V2–V4 migration files (for sales-service and operations-service). With a clean-slate database, there is no prior state for incremental migrations to operate on — all content must be in V1.
