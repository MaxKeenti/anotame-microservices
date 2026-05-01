-- Add is_deleted column to tcc_price_list to support soft-delete via @SQLDelete.
-- The @SQLDelete annotation was referencing this column, causing DELETE requests to fail.
ALTER TABLE tcc_price_list ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: rows that already have deleted_at set should be marked as deleted.
UPDATE tcc_price_list SET is_deleted = TRUE WHERE deleted_at IS NOT NULL;
