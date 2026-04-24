-- V2__translate_seed_data_to_spanish.sql
-- Translates existing English seed data to Spanish.
-- Safe to run multiple times (updates by matching English name).
-- Schema columns stay in English; only data values change.

BEGIN;

-- ============================================================
-- GARMENT TYPES: English → Spanish
-- ============================================================
UPDATE cci_garment_type SET name = 'Pantalón',  description = 'Pantalones de vestir, Jeans, Chinos'  WHERE name = 'Pants';
UPDATE cci_garment_type SET name = 'Camisa',    description = 'Camisa de vestir, Playera, Polo'      WHERE name = 'Shirt';
UPDATE cci_garment_type SET name = 'Chamarra',  description = 'Saco, Blazer, Abrigo'                 WHERE name = 'Jacket';
UPDATE cci_garment_type SET name = 'Vestido',   description = 'Casual, Formal'                       WHERE name = 'Dress';
UPDATE cci_garment_type SET name = 'Falda',     description = 'Mini, Midi, Maxi'                     WHERE name = 'Skirt';
UPDATE cci_garment_type SET name = 'Traje',     description = '2 Piezas, 3 Piezas'                   WHERE name = 'Suit';

-- ============================================================
-- SERVICES: English → Spanish
-- ============================================================
UPDATE cci_service SET name = 'Bastilla',         description = 'Acortar largo de prenda'              WHERE name = 'Hemming';
UPDATE cci_service SET name = 'Entallado',        description = 'Ajustar para un corte más delgado'    WHERE name = 'Tapering';
UPDATE cci_service SET name = 'Cambio de Cierre', description = 'Instalación de cierre nuevo'          WHERE name = 'Zipper Replace';
UPDATE cci_service SET name = 'Parche',           description = 'Reparar agujero o rasgadura'          WHERE name = 'Patching';
UPDATE cci_service SET name = 'Cambio de Botón',  description = 'Coser botón nuevo'                    WHERE name = 'Button Replace';
UPDATE cci_service SET name = 'Lavado en Seco',   description = 'Lavado en seco estándar'              WHERE name = 'Dry Clean';

COMMIT;

-- Verification
SELECT 'garment_types' AS entity, name, description FROM cci_garment_type WHERE is_deleted = false ORDER BY name;
SELECT 'services' AS entity, name, description FROM cci_service WHERE is_deleted = false ORDER BY name;
