-- Add locale preference column to tca_user
-- Default 'es' (Spanish) — Paraglide sourceLanguageTag
ALTER TABLE tca_user ADD COLUMN locale VARCHAR(10) DEFAULT 'es' NOT NULL;

-- Set all existing users to 'es' (explicit, even though DEFAULT handles it)
COMMENT ON COLUMN tca_user.locale IS 'User locale preference for UI language (BCP-47 tag: es, en)';
