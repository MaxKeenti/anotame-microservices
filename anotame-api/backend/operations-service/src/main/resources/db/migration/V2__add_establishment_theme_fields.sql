-- Flyway Migration: Add establishment theme customization fields
-- Adds support for per-tenant brand color and font family overrides

ALTER TABLE tce_establishment ADD COLUMN primary_color VARCHAR(7) NULL;
COMMENT ON COLUMN tce_establishment.primary_color IS 'Hex color format: #RRGGBB (e.g., #FF6B6B). Null = use default Anotame theme.';

ALTER TABLE tce_establishment ADD COLUMN font_family VARCHAR(32) NULL;
COMMENT ON COLUMN tce_establishment.font_family IS 'Font family selection: Inter, Outfit, or Merriweather. Null = use default Inter Variable.';
