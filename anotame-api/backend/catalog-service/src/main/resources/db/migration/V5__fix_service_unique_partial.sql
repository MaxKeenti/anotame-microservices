-- V5__fix_service_unique_partial.sql
-- Fix: replace the plain UNIQUE constraint with a partial unique index
-- scoped to non-deleted rows.
--
-- Root cause: V2 added UNIQUE(name, id_garment_type) as a table constraint that
-- includes soft-deleted rows. When a soft-deleted row shares (name, id_garment_type)
-- with an active row (possible after V2's upsert-in-place logic), any UPDATE to
-- the active row triggers a duplicate key violation even when name/garment_type
-- are not changing — because PostgreSQL checks ALL rows, not just the updated one.
--
-- The partial index enforces uniqueness only among active records, which is the
-- intended business rule.

ALTER TABLE cci_service DROP CONSTRAINT IF EXISTS uq_service_name_garment_type;

CREATE UNIQUE INDEX uq_service_name_garment_type
    ON cci_service (name, id_garment_type)
    WHERE is_deleted = false;
