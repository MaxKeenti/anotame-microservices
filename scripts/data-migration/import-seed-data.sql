-- import-seed-data.sql
-- Imports garment types, services, and price list items from CSV-sourced data.
-- Run against the catalog-service database.
-- Idempotent: uses ON CONFLICT DO NOTHING (assumes name is the natural key).

BEGIN;

-- ============================================================
-- 1. GARMENT TYPES
-- ============================================================
-- Add a unique constraint on name if it doesn't exist (needed for upsert)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_garment_type_name'
    ) THEN
        ALTER TABLE cci_garment_type ADD CONSTRAINT uq_garment_type_name UNIQUE (name);
    END IF;
END $$;

-- INSERT your garment types here. Replace/add rows as needed from your CSV.
-- The template below matches templates/garment_types.csv
INSERT INTO cci_garment_type (name, description, is_active)
VALUES
    ('Pantalón', 'Pantalones de vestir, Jeans, Chinos', true),
    ('Camisa', 'Camisa de vestir, Playera, Polo', true),
    ('Chamarra', 'Saco, Blazer, Abrigo', true),
    ('Vestido', 'Casual, Formal', true),
    ('Falda', 'Mini, Midi, Maxi', true),
    ('Traje', '2 Piezas, 3 Piezas', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. SERVICES
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_service_name'
    ) THEN
        ALTER TABLE cci_service ADD CONSTRAINT uq_service_name UNIQUE (name);
    END IF;
END $$;

-- INSERT services. garment_type is resolved by name via subquery.
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active)
VALUES
    ('Bastilla', 'Acortar largo de prenda', 15, 12.00,
     (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Entallado', 'Ajustar para un corte más delgado', 30, 25.00,
     (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de Cierre', 'Instalación de cierre nuevo', 45, 20.00,
     (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Parche', 'Reparar agujero o rasgadura', 20, 10.00,
     (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de Botón', 'Coser botón nuevo', 5, 2.00,
     (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Lavado en Seco', 'Lavado en seco estándar', 1440, 8.00,
     (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Traje'), true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. PRICE LIST (create a default one if needed)
-- ============================================================
INSERT INTO tcc_price_list (name, valid_from, is_active, priority)
SELECT 'Lista General 2026', NOW(), true, 10
WHERE NOT EXISTS (
    SELECT 1 FROM tcc_price_list WHERE name = 'Lista General 2026'
);

-- ============================================================
-- 4. PRICE LIST ITEMS
-- ============================================================
-- Links services to the price list. Skips if already linked.
INSERT INTO tcc_price_list_item (id_price_list, id_service, price)
SELECT
    pl.id_price_list,
    s.id_service,
    v.price
FROM (VALUES
    ('Bastilla',         12.00::NUMERIC(19,4)),
    ('Entallado',        25.00::NUMERIC(19,4)),
    ('Cambio de Cierre', 20.00::NUMERIC(19,4)),
    ('Parche',           10.00::NUMERIC(19,4)),
    ('Cambio de Botón',   2.00::NUMERIC(19,4)),
    ('Lavado en Seco',    8.00::NUMERIC(19,4))
) AS v(service_name, price)
JOIN cci_service s ON s.name = v.service_name
CROSS JOIN tcc_price_list pl
WHERE pl.name = 'Lista General 2026'
  AND NOT EXISTS (
      SELECT 1 FROM tcc_price_list_item pli
      WHERE pli.id_price_list = pl.id_price_list
        AND pli.id_service = s.id_service
  );

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'garment_types' AS entity, COUNT(*) AS total FROM cci_garment_type WHERE is_deleted = false
UNION ALL
SELECT 'services', COUNT(*) FROM cci_service WHERE is_deleted = false
UNION ALL
SELECT 'price_lists', COUNT(*) FROM tcc_price_list
UNION ALL
SELECT 'price_list_items', COUNT(*) FROM tcc_price_list_item;
