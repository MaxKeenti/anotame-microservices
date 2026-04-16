---
phase: 18-db-ownership-fresh-v1-baselines
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql
  - anotame-api/backend/identity-service/src/main/resources/application.properties
  - anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql
  - anotame-api/backend/catalog-service/src/main/resources/application.properties
  - anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql
  - anotame-api/backend/sales-service/src/main/resources/application.properties
  - anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql
  - anotame-api/backend/operations-service/src/main/resources/application.properties
findings:
  critical: 2
  warning: 9
  info: 4
  total: 15
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-04-16
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

All four services received new clean V1 baseline SQL migrations and updated `application.properties` files as part of the DB ownership refactor. The migrations are broadly well-structured: bounded contexts are respected, cross-service FK references have been correctly dropped in favour of snapshot columns, and audit timestamps are consistent on most tables.

Two critical issues are present: a cascade-delete on audit log tables destroys the audit trail when an order is deleted (a data integrity bug), and weak hardcoded credential defaults in all four `application.properties` files are a deployment security risk. Nine warnings cover missing project-mandated soft-delete fields, missing UUID defaults on two PKs, and Hibernate DDL auto-update leaking into non-production profiles. Four informational items address minor inconsistencies and a loaded-but-unused database extension.

---

## Critical Issues

### CR-01: Cascade delete on audit log destroys the audit trail

**File:** `anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql:97`
**Issue:** `tco_order_audit_log` uses `ON DELETE CASCADE` on its FK to `tco_order`. This means deleting (or soft-deleting via a hard DELETE) an order row also silently deletes all associated audit records. An audit log must survive the deletion of the entity it audits — otherwise the record of who changed what is permanently lost. `tco_order_history` at line 87 has the same problem, though it is less severe since history rows are less security-sensitive than an audit log.
**Fix:**
```sql
-- tco_order_audit_log: remove ON DELETE CASCADE, replace with RESTRICT
CREATE TABLE tco_order_audit_log (
    id_audit    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order    UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE RESTRICT,
    user_id     UUID NOT NULL,
    field_name  VARCHAR(100) NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If orders must be hard-deleted, consider a nullable FK with SET NULL instead:
-- id_order UUID REFERENCES tco_order(id_order) ON DELETE SET NULL
```
The business domain should decide whether orders are ever hard-deleted at all. If soft-delete is the pattern (`is_deleted`), cascade behaviour is irrelevant for normal operations, but it remains a risk for any maintenance or cleanup scripts.

### CR-02: Weak hardcoded credential defaults in all application.properties files

**Files:**
- `anotame-api/backend/identity-service/src/main/resources/application.properties:8`
- `anotame-api/backend/catalog-service/src/main/resources/application.properties:9`
- `anotame-api/backend/sales-service/src/main/resources/application.properties:8`
- `anotame-api/backend/operations-service/src/main/resources/application.properties:9`

**Issue:** All four services fall back to `admin` / `password` when `QUARKUS_DATASOURCE_USERNAME` or `QUARKUS_DATASOURCE_PASSWORD` environment variables are absent. If any service is ever deployed to a non-local environment without those env vars set (misconfigured CI, staging, or production), it will silently connect with the well-known default credentials. Worse, a failed-open connection would not raise an obvious startup error.
**Fix:**
```properties
# Remove the default value entirely so Quarkus fails fast on missing config.
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD}

# For local dev, provide the values via a .env file or %dev profile override:
%dev.quarkus.datasource.username=admin
%dev.quarkus.datasource.password=password
```
Scoping the defaults to the `%dev` profile keeps local development ergonomics intact while ensuring any other profile fails to start without explicit credentials.

---

## Warnings

### WR-01: tcc_price_list missing is_deleted — soft-delete pattern incomplete

**File:** `anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql:32-42`
**Issue:** `tcc_price_list` has `deleted_at TIMESTAMPTZ` but no `is_deleted BOOLEAN`. Per AI_RULES.md, every transactional table must use both `deleted_at` AND `is_deleted`. The JPA `@SQLRestriction("is_deleted = false")` annotation expected by the entity layer will fail at runtime without this column.
**Fix:**
```sql
CREATE TABLE tcc_price_list (
    ...
    deleted_at    TIMESTAMPTZ,
    is_deleted    BOOLEAN DEFAULT FALSE NOT NULL   -- add this line
);
```

### WR-02: tcc_price_list_item missing soft-delete fields entirely

**File:** `anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql:44-51`
**Issue:** `tcc_price_list_item` has neither `deleted_at` nor `is_deleted`. If the JPA entity for this table uses `@SQLDelete` / `@SQLRestriction`, queries will error at runtime.
**Fix:**
```sql
CREATE TABLE tcc_price_list_item (
    ...
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ,
    is_deleted         BOOLEAN DEFAULT FALSE NOT NULL
);
```

### WR-03: tce_establishment and tce_branch missing is_deleted

**File:** `anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql:10-35`
**Issue:** Both `tce_establishment` (line 10) and `tce_branch` (line 24) have `deleted_at` but no `is_deleted`. Same soft-delete inconsistency as WR-01; will break `@SQLRestriction` on JPA entities.
**Fix:** Add `is_deleted BOOLEAN DEFAULT FALSE NOT NULL` to both table definitions, after `deleted_at`.

### WR-04: tce_employee_assignment, top_work_day, top_holiday, top_shift, tco_work_order, tco_work_order_item — no soft-delete fields at all

**File:** `anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql:37-92`
**Issue:** Six tables in operations-service omit both `deleted_at` and `is_deleted`. If these entities use the project-standard JPA soft-delete annotations, they will fail. Even if those tables intentionally use hard deletes, the absence of `deleted_at` is inconsistent with the rest of the schema and will cause confusion.
**Fix:** Determine whether each table uses soft delete. If yes, add both columns. If hard delete is intentional, document it explicitly in the SQL comment header.

### WR-05: tco_work_order and tco_work_order_item PKs have no DEFAULT gen_random_uuid()

**File:** `anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql:77-92`
**Issue:** Both PKs are declared as `UUID PRIMARY KEY` without a default. Every other table in the project uses `DEFAULT gen_random_uuid()`. Without the default, any INSERT that omits the PK value will fail with a null-constraint violation. If the application layer always supplies the UUID this is not a bug today, but it is a brittle contract — a missed field in a new code path causes a hard failure rather than a safe auto-generated fallback.
**Fix:**
```sql
CREATE TABLE tco_work_order (
    id_work_order UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
);

CREATE TABLE tco_work_order_item (
    id_work_order_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
);
```

### WR-06: Hibernate DDL auto-update active outside dev profile

**Files:**
- `anotame-api/backend/identity-service/src/main/resources/application.properties:11`
- `anotame-api/backend/catalog-service/src/main/resources/application.properties:12`
- `anotame-api/backend/sales-service/src/main/resources/application.properties:11`
- `anotame-api/backend/operations-service/src/main/resources/application.properties:11`

**Issue:** `quarkus.hibernate-orm.database.generation=update` is set at the base (unprovisioned) level. The `%prod.quarkus.hibernate-orm.database.generation=none` override only suppresses it in the `prod` profile. The `test` profile and any other custom profile will still run with `update`, meaning Hibernate can silently alter schema during CI, masking Flyway migration regressions.
**Fix:**
```properties
# Change the base setting to none so it is safe for all profiles by default.
quarkus.hibernate-orm.database.generation=none

# Keep update only for the dev profile:
%dev.quarkus.hibernate-orm.database.generation=update

# Remove the redundant %prod override (now unnecessary).
```

### WR-07: tco_order.folio_branch has no unique constraint scoped to id_branch

**File:** `anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql:30-31`
**Issue:** `folio_branch INTEGER NOT NULL` is described by its name as a per-branch sequential folio number, but there is no `UNIQUE (id_branch, folio_branch)` constraint. Duplicate folios within the same branch can be inserted without error, producing multiple orders sharing the same folio reference — a correctness bug in order tracking.
**Fix:**
```sql
-- Add a composite unique constraint:
ALTER TABLE tco_order ADD CONSTRAINT uq_order_folio_per_branch UNIQUE (id_branch, folio_branch);

-- Or inline in the CREATE TABLE:
CONSTRAINT uq_order_folio_per_branch UNIQUE (id_branch, folio_branch)
```

### WR-08: tco_customer missing is_active

**File:** `anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql:15-26`
**Issue:** `tco_customer` has `is_deleted` and `deleted_at` (soft delete is present) but no `is_active BOOLEAN`. Every comparable table across the project (e.g., `cca_role`, `tca_user`, `cci_garment_type`, `cci_service`, `tce_establishment`, `tce_branch`) includes `is_active`. If the application code assumes this column exists and filters by it, a runtime error will occur. Even if not currently referenced, the omission breaks the project-wide schema contract.
**Fix:**
```sql
CREATE TABLE tco_customer (
    ...
    is_deleted   BOOLEAN DEFAULT FALSE NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE NOT NULL   -- add this line
);
```

### WR-09: tco_order_history ON DELETE CASCADE removes history on order delete

**File:** `anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql:87`
**Issue:** `tco_order_history` cascades on order deletion. While less severe than the audit log (CR-01), losing status-change history when an order is deleted removes operational context needed for support and reconciliation.
**Fix:** Replace `ON DELETE CASCADE` with `ON DELETE RESTRICT` (or `SET NULL` on a nullable FK if orders must be deletable). See CR-01 for the broader reasoning.

---

## Info

### IN-01: citext extension loaded but never used in identity-service

**File:** `anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql:6`
**Issue:** `CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public` is executed but no column in the migration uses the `CITEXT` type. The extension was likely intended for case-insensitive email or username matching. Either use it or remove the statement to keep the migration clean.
**Fix:** If case-insensitive matching is desired for `tca_user.email` or `username`, change those columns to `CITEXT`. Otherwise, remove the extension creation line.

### IN-02: Nullable created_at / updated_at on several tables

**Files:**
- `anotame-api/backend/identity-service/src/main/resources/db/migration/V1__baseline.sql:14-15,30-31`
- `anotame-api/backend/catalog-service/src/main/resources/db/migration/V1__baseline.sql:11-12,21-22,40-41,49-50`

**Issue:** `created_at` and `updated_at` are declared without `NOT NULL`. Because they default to `NOW()`, they will never actually be null in practice, but the column type permits it. Hibernate's `@CreationTimestamp` / `@UpdateTimestamp` rely on the column never being null. Adding `NOT NULL` makes the constraint explicit and prevents surprising nulls from bulk-inserts that bypass the ORM.
**Fix:**
```sql
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
```

### IN-03: pgcrypto extension re-declared in every service migration

**Files:** All four V1__baseline.sql files (lines 5)
**Issue:** Each service migration runs `CREATE EXTENSION IF NOT EXISTS pgcrypto` against the same shared `anotame` database. While `IF NOT EXISTS` makes this idempotent and harmless, it is redundant after the first service migration runs. A single shared schema-init script (or the identity-service baseline as the canonical extension installer) would be cleaner.
**Fix:** This is a low-priority cosmetic issue. No change is required; it functions correctly as-is. Consider documenting that extension setup is idempotent by design.

### IN-04: CORS origins include a hardcoded production URL in non-prod config

**Files:**
- `anotame-api/backend/identity-service/src/main/resources/application.properties:20`
- `anotame-api/backend/catalog-service/src/main/resources/application.properties:22`
- `anotame-api/backend/sales-service/src/main/resources/application.properties:22`
- `anotame-api/backend/operations-service/src/main/resources/application.properties:23`

**Issue:** `quarkus.http.cors.origins` is set at the base level with both `http://localhost:3000` and the hardcoded Railway production URL. In a `test` profile the CORS policy will permit requests from the production origin, which is unexpected. The production origin should be scoped to the `%prod` profile.
**Fix:**
```properties
# Base (dev/test): local origin only
quarkus.http.cors.origins=http://localhost:3000

# Production: add the Railway origin
%prod.quarkus.http.cors.origins=http://localhost:3000,https://anotame-microservices-production.up.railway.app
```

---

_Reviewed: 2026-04-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
