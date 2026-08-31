-- V6__fix_garment_unique_partial.sql
-- Fix: apply V5's fix to cci_garment_type, then clean up the damage the unfixed
-- constraint caused.
--
-- Root cause: V2 added UNIQUE(name) to cci_garment_type as a table constraint spanning
-- every row. V5 replaced the equivalent constraint on cci_service with a partial index
-- but left this one in place. Because deleting a garment only clears is_active, a
-- deleted name stays reserved forever and re-adding it fails with a duplicate key
-- error -- surfaced to the user as an untranslated "A record with the same name
-- already exists". The observable workaround was to retype the name with a trailing
-- space, which is why 'Abrigo'/'Abrigo ', 'Cortina'/'Cortina ' and 'Toalla'/'Toalla '
-- all exist and render identically in every picker.
--
-- Scope: garments only. Services have the same whitespace twins, but those pairs
-- differ in base_price and default_duration_min, so picking a survivor is a pricing
-- decision rather than a mechanical one and is handled separately.

-- 1. Drop the over-broad constraint first: the trimming in step 4 would otherwise
--    collide with the very rows it is meant to reconcile.
ALTER TABLE cci_garment_type DROP CONSTRAINT IF EXISTS uq_garment_type_name;

-- 2. Repoint services from a whitespace twin onto the oldest row sharing its trimmed
--    name, so nothing is orphaned when the twin is retired in step 3.
WITH canonical AS (
    SELECT DISTINCT ON (lower(trim(name)))
           lower(trim(name)) AS name_key,
           id_garment_type   AS keep_id
    FROM cci_garment_type
    WHERE is_active AND NOT is_deleted
    ORDER BY lower(trim(name)), created_at, id_garment_type
)
UPDATE cci_service s
SET id_garment_type = c.keep_id
FROM cci_garment_type g
JOIN canonical c ON c.name_key = lower(trim(g.name))
WHERE s.id_garment_type = g.id_garment_type
  AND g.id_garment_type <> c.keep_id;

-- 3. Retire the twins by deactivating rather than soft-deleting. Deactivating removes
--    them from the picker (the app reads is_active) while findById still resolves, so
--    order items in sales-service already pointing at one of these ids keep resolving.
WITH canonical AS (
    SELECT DISTINCT ON (lower(trim(name)))
           lower(trim(name)) AS name_key,
           id_garment_type   AS keep_id
    FROM cci_garment_type
    WHERE is_active AND NOT is_deleted
    ORDER BY lower(trim(name)), created_at, id_garment_type
)
UPDATE cci_garment_type g
SET is_active = false,
    updated_at = NOW()
FROM canonical c
WHERE c.name_key = lower(trim(g.name))
  AND g.id_garment_type <> c.keep_id
  AND g.is_active AND NOT g.is_deleted;

-- 4. Normalise what remains, including the deactivated rows, so the stored data no
--    longer depends on invisible characters.
UPDATE cci_garment_type
SET name = trim(name),
    description = NULLIF(trim(description), '')
WHERE name IS DISTINCT FROM trim(name)
   OR description IS DISTINCT FROM NULLIF(trim(description), '');

-- 5. Enforce uniqueness among the rows the user can actually see. Partial for the same
--    reason V5 is: a retired name must be reusable.
CREATE UNIQUE INDEX uq_garment_type_name
    ON cci_garment_type (lower(trim(name)))
    WHERE is_active AND is_deleted = false;
