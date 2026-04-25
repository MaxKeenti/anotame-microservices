-- V2__full_catalog_import.sql
-- Imports the complete business catalog: 26 garment types, 254 services.
-- Changes service uniqueness from global name to (name, id_garment_type).
-- Soft-deletes placeholder seed services from V1/DataSeeder.

BEGIN;

-- ============================================================
-- 1. FIX UNIQUE CONSTRAINT: name per garment type, not global
-- ============================================================
-- Drop global unique on service name if it was added by import scripts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_service_name') THEN
        ALTER TABLE cci_service DROP CONSTRAINT uq_service_name;
    END IF;
END $$;

-- Add composite unique: same service name is allowed across different garment types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_service_name_garment_type') THEN
        ALTER TABLE cci_service ADD CONSTRAINT uq_service_name_garment_type UNIQUE (name, id_garment_type);
    END IF;
END $$;

-- Ensure garment type name uniqueness
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_garment_type_name') THEN
        ALTER TABLE cci_garment_type ADD CONSTRAINT uq_garment_type_name UNIQUE (name);
    END IF;
END $$;

-- ============================================================
-- 2. SOFT-DELETE PLACEHOLDER SERVICES (from DataSeeder/V1 seeds)
-- ============================================================
UPDATE cci_service
SET is_deleted = true, deleted_at = NOW()
WHERE name IN ('Bastilla', 'Entallado', 'Cambio de Cierre', 'Parche', 'Cambio de Botón', 'Lavado en Seco',
               'Hemming', 'Tapering', 'Zipper Replace', 'Patching', 'Button Replace', 'Dry Clean')
  AND is_deleted = false;

-- Also soft-delete the Traje garment type (no services in real catalog)
UPDATE cci_garment_type
SET is_deleted = true, deleted_at = NOW()
WHERE name = 'Traje' AND is_deleted = false;

-- ============================================================
-- 3. GARMENT TYPES — 26 types from business catalog
-- ============================================================
-- Update existing descriptions to reflect that Saco/Abrigo are now separate types
UPDATE cci_garment_type SET description = 'Chamarras, Cazadoras' WHERE name = 'Chamarra' AND is_deleted = false;

INSERT INTO cci_garment_type (name, description, is_active) VALUES
    ('Pantalón',       'Pantalones de vestir, Jeans, Chinos', true),
    ('Camisa',         'Camisa de vestir, guayabera', true),
    ('Chamarra',       'Chamarras, Cazadoras', true),
    ('Vestido',        'Casual, Formal, Noche', true),
    ('Falda',          'Mini, Midi, Maxi', true),
    ('Blusa',          'Blusas, tops con mangas', true),
    ('Suéter',         'Suéteres, cardiganes', true),
    ('Pans',           'Pants deportivos, joggers', true),
    ('Saco',           'Sacos de vestir, blazers', true),
    ('Playera',        'Playeras, camisetas, tank tops', true),
    ('Short',          'Shorts, bermudas', true),
    ('Licras',         'Leggings, mallas deportivas', true),
    ('Abrigo',         'Abrigos, gabardinas', true),
    ('Faja',           'Fajas reductoras, correctivas', true),
    ('Corbata',        'Corbatas, moños', true),
    ('Cojín',          'Cojines decorativos, de silla', true),
    ('Bolsa',          'Bolsas, bolsos, mochilas', true),
    ('Toalla',         'Toallas de baño, mano', true),
    ('Mantel',         'Manteles de mesa', true),
    ('Varios',         'Artículos sueltos sin categoría específica', true),
    ('Sábanas',        'Sábanas, fundas de almohada', true),
    ('Peluche',        'Muñecos de peluche, figuras rellenas', true),
    ('Tapete',         'Tapetes, alfombras pequeñas', true),
    ('Cortina',        'Cortinas, visillos', true),
    ('Cobija',         'Cobijas, mantas', true),
    ('Calcetines',     'Calcetines, medias', true),
    ('Ropa Interior',  'Boxers, calzones, brasieres', true)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ============================================================
-- 4. SERVICES — 254 services from business price sheets
-- ============================================================
-- Helper: insert service by garment type name lookup
-- Using ON CONFLICT on composite (name, id_garment_type) for idempotency

-- pantalón (32 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajuste de cintura', 'Reducción o ampliación de la cintura del pantalón', 30, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Ajuste de costado', 'Ajuste en los laterales para mejorar la silueta', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Ajuste de piernas', 'Reducción del ancho de las piernas del pantalón', 30, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Valenciana española', 'Dobladillo con estilo de valenciana española', 20, 70.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Dobladillo a mano', 'Ajuste de largo cosido a mano para un acabado invisible', 30, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Dobladillo a maquina', 'Ajuste de largo cosido a máquina', 15, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de cierre de Nylon o invisible', 'Reemplazo de cremallera de nylon o invisible', 45, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de cierre de Metal', 'Reemplazo de cremallera metálica', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Ajuste de cintura con costado', 'Ajuste combinado de cintura y laterales', 60, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Ajuste de piernas con dobladillo', 'Ajuste de ancho de piernas y largo', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Ajuste de cintura con costado y dobladillo', 'Ajuste completo de cintura laterales y largo', 75, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Ajuste de cintura con piernas y dobladillo', 'Ajuste de cintura ancho de piernas y largo', 75, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Poner parche', 'Aplicación de un parche en zona dañada', 15, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Poner parches', 'Aplicación de múltiples parches', 30, 60.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de bolsa', 'Reemplazo de un bolsillo interno dañado', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de bolsas', 'Reemplazo de ambos bolsillos internos', 60, 140.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Poner falso en pretina', 'Adición de falso de tela para extender la pretina', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Poner ajustador', 'Instalación de ajustador en la cintura', 20, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Quitar pinzas', 'Eliminación de pinzas para soltar tela', 30, 125.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Quitar pinzas con ajuste de piernas', 'Eliminación de pinzas y ajuste de ancho de piernas', 60, 200.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Quitar pinzas con ajuste de costados y ajuste de cintura', 'Eliminación de pinzas con ajuste lateral y de cintura', 90, 280.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Recoser tiro', 'Reparación de costura en el tiro del pantalón', 15, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Poner parche en tiro', 'Aplicación de parche en la zona del tiro', 20, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Recoser costado', 'Reparación de costura en un lateral', 15, 45.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Recoser costados', 'Reparación de costuras en ambos laterales', 25, 60.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de cierre de lado al centro', 'Modificación de la posición del cierre de lado a centro', 60, 180.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Aumento con cuchillas', 'Ampliación de talla mediante inserción de cuchillas de tela', 60, 140.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Aumentar cintura por pinzas', 'Ampliación de cintura soltando costura de pinzas', 30, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Cambio de forro', 'Reemplazo completo del forro interior', 90, 280.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Colocar boton metal', 'Instalación de botón metálico', 5, 20.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Colocar boton plastico', 'Instalación de botón de plástico', 5, 10.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true),
    ('Correr ajuste', 'Modificación y reubicación de ajuste', 45, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pantalón'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- blusa (25 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajuste de costados', 'Ajuste en los laterales de la blusa', 30, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Ajuste de mangas', 'Modificación del ancho de las mangas', 30, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Ajuste de hombro', 'Modificación de la caída del hombro', 60, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Dobladillo de ruedo a máquina', 'Ajuste de largo cosido a máquina', 15, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Dobladillo de ruedo a mano', 'Ajuste de largo cosido a mano para un acabado invisible', 30, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Ajuste de manga con puño', 'Ajuste integral de manga y puño', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Ajuste de costados con manga dobladillo y puño', 'Ajuste completo de laterales mangas largo y puños', 90, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Ajuste de costado con dobladillo', 'Ajuste lateral y de largo', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Ajuste de hombro con costado y puño', 'Ajuste de hombros laterales y puños', 90, 195.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Parchar con cuchilla', 'Aplicación de parche insertando cuchilla de tela', 30, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Parche con costura', 'Aplicación de parche sencillo cosido', 20, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Cortar mangas', 'Reducción del largo de mangas', 20, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Colocar broches de presión', 'Instalación de broche de presión', 5, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Colocar broche de gancho', 'Instalación de broche tipo gancho', 5, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Retirar o poner resorte', 'Cambio o instalación de banda elástica', 30, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Dobladillo a mano forrado o a máquina', 'Dobladillo en blusa con forro', 45, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Cambio de forro', 'Reemplazo del forro interior', 90, 165.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Voltear cuello', 'Rotación del cuello para ocultar desgaste', 30, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Recortar cuello', 'Reducción del tamaño del cuello', 30, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Transformar puños', 'Modificación de estilo o tamaño de los puños', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Colocar boton', 'Instalación de botón', 5, 10.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Subir hombros', 'Ajuste para subir la costura de los hombros', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Subir hombros y puños', 'Ajuste combinado de hombros y puños', 60, 170.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Subir hombros puños y faldilla', 'Ajuste completo de hombros puños y faldilla', 90, 180.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true),
    ('Subir puños', 'Ajuste de posición de los puños', 30, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Blusa'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- falda (15 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajuste de cintura', 'Reducción o ampliación de la cintura', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Ajuste de costado', 'Ajuste en los laterales de la falda', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Ajuste de cintura con costado', 'Ajuste combinado de cintura y laterales', 60, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Dobladillo a mano sin forro', 'Ajuste de largo cosido a mano para un acabado invisible en falda sin forro', 30, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Dobladillo a máquina sin forro', 'Ajuste de largo cosido a máquina en falda sin forro', 15, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Dobladillo a máquina con forro', 'Ajuste de largo cosido a máquina en falda con forro', 30, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Dobladillo a mano con forro', 'Ajuste de largo cosido a mano en falda con forro', 45, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Cambio de cierre de Nylon o invisible', 'Reemplazo de cremallera de nylon o invisible', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Cambio de cierre de metal', 'Reemplazo de cremallera metálica', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Aumentar pretina', 'Adición de tela o ajuste para agrandar la pretina', 45, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Parchar', 'Aplicación de un parche en zona dañada', 20, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Colocar broches', 'Instalación de broches', 10, 20.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Hacer cuchillas (Sobre Costura)', 'Inserción de cuchillas de tela sobre la costura para dar amplitud', 60, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Resorte en cintura', 'Instalación de banda elástica en la cintura', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true),
    ('Cambiar resorte', 'Reemplazo de banda elástica en la cintura', 30, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Falda'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- camisa (21 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajuste de costados', 'Ajuste en los laterales de la camisa', 30, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Ajuste de costado con mangas', 'Ajuste lateral y de ancho de mangas', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Ajuste de costado con mangas y subir puño', 'Ajuste lateral mangas y posición de puños', 60, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Ajuste de costado con mangas puño y dobladillo a maquina', 'Ajuste completo lateral mangas puños y largo', 90, 270.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Cambio de cuello', 'Reemplazo del cuello de la camisa', 45, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Cambio de cuello con pie de cuello y ojal', 'Reemplazo de cuello incluyendo pie y ojal', 60, 70.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Parchar', 'Aplicación de un parche en zona dañada', 20, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Hacer cuchilla', 'Inserción de cuchilla de tela para ampliar', 60, 180.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Hacer bolsa', 'Confección y aplicación de un bolsillo', 45, 95.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Cortar manga', 'Reducción del largo de las mangas', 20, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Subir de puño', 'Ajuste de posición de los puños', 30, 130.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Poner botón', 'Instalación de botón', 5, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Colocar ojal en cuello', 'Creación de ojal en el cuello', 15, 30.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Poner escudos', 'Aplicación de escudo o parche bordado', 10, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Poner sectores', 'Aplicación de sector o insignia', 10, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Dobladillo a maquina y subir puño', 'Ajuste de largo a máquina y posición de puños', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Dobladillo a maquina faldilla', 'Ajuste de largo de faldilla a máquina', 20, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Voltear cuellos', 'Rotación del cuello para ocultar desgaste', 30, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Cuchillas con tela de canesú', 'Inserción de cuchillas usando tela del canesú', 60, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Subir hombros', 'Ajuste para subir la costura de los hombros', 45, 110.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true),
    ('Subir hombros y puños', 'Ajuste combinado de hombros y puños', 60, 195.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Camisa'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- suéter (19 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajuste de costados', 'Ajuste en los laterales del suéter', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Ajuste de mangas', 'Ajuste del ancho de las mangas', 30, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Ajuste de costado con mangas', 'Ajuste combinado de laterales y mangas', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Dobladillo de mangas', 'Ajuste del largo de las mangas', 20, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Dobladillo de ruedo', 'Ajuste del largo total del suéter', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner parche en codos', 'Aplicación de parches en la zona de los codos', 30, 130.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Zurcir hilos zafados', 'Reparación de hilos sueltos o rotos', 20, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner cierre en mangas', 'Instalación de cierres en las mangas', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Cambio de cierre de metal', 'Reemplazo de cremallera metálica', 45, 150.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Cambio de cierre de plástico', 'Reemplazo de cremallera de plástico', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner botón', 'Instalación de botón', 5, 10.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner franjas', 'Aplicación de franja decorativa', 15, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner escudos', 'Aplicación de escudo o parche bordado', 10, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner escudos con franjas', 'Aplicación combinada de escudo y franjas', 20, 45.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner dos franjas', 'Aplicación de dos franjas decorativas', 20, 45.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Poner tres franjas', 'Aplicación de tres franjas decorativas', 30, 60.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Ajustar puños', 'Ajuste del ancho o elástico de los puños', 20, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Subir hombros', 'Ajuste para subir la costura de los hombros', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true),
    ('Subir hombros y puños', 'Ajuste combinado de hombros y posición de puños', 60, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Suéter'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- saco (17 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajuste de costados', 'Ajuste en los laterales del saco', 45, 170.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Ajuste de mangas', 'Ajuste del ancho de las mangas', 30, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Subir puños', 'Ajuste de posición de los puños', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Ajuste de centro', 'Ajuste en la costura central de la espalda', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Ajuste de hombro', 'Modificación de la caída del hombro', 60, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Ajuste de costado con mangas', 'Ajuste combinado de laterales y mangas', 60, 200.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Ajuste de costado con mangas y ruedo', 'Ajuste lateral mangas y largo del saco', 90, 250.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Ajuste de costado con mangas ruedo y centro con hombros', 'Ajuste completo de saco', 120, 350.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Parche con cuchilla', 'Aplicación de parche insertando cuchilla', 30, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Subir hombros y puños', 'Ajuste combinado de hombros y posición de puños', 90, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Cambio de forro completo', 'Reemplazo total del forro interior del saco', 180, 450.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Cambio de forro de alguna pieza', 'Reemplazo parcial del forro', 60, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Poner botones x pieza', 'Instalación de un botón', 5, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Cambio de botones', 'Reemplazo de todos los botones del saco', 30, 130.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Ajuste de solapa', 'Modificación de la forma o tamaño de la solapa', 60, 125.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Subir largo faldilla', 'Ajuste del largo de la faldilla del saco', 60, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true),
    ('Aflojar contornos', 'Ampliación de los contornos del saco', 90, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Saco'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- vestido (24 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajuste de costados', 'Ajuste en los laterales del vestido', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Ajuste de costados forrado', 'Ajuste en los laterales del vestido con forro', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Ajuste de mangas', 'Modificación del ancho de las mangas', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Ajuste de hombros', 'Ajuste en la costura de los hombros', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Dobladillo a mano sin forro', 'Ajuste de largo cosido a mano para vestido sin forro', 45, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Dobladillo a máquina sin forro', 'Ajuste de largo cosido a máquina para vestido sin forro', 20, 110.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Dobladillo a mano con forro', 'Ajuste de largo cosido a mano para vestido con forro', 60, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Dobladillo a máquina con forro', 'Ajuste de largo cosido a máquina para vestido con forro', 30, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Ajuste de costados con mangas', 'Ajuste combinado de laterales y mangas', 60, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Ajuste de costados con mangas y dobladillo', 'Ajuste de laterales mangas y largo', 90, 240.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Ajuste de costados con mangas dobladillo y cambio de cierre', 'Ajuste completo con cambio de cierre', 120, 295.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Ajuste de costados con mangas dobladillo y subir puños', 'Ajuste completo y posición de puños', 105, 285.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Cambio de cierre', 'Reemplazo de cremallera del vestido', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Poner botón', 'Instalación de un botón', 5, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Poner botones', 'Instalación de múltiples botones', 30, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Poner broche', 'Instalación de un broche', 10, 15.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Hacer pinzas', 'Creación de pinzas para ajustar la silueta', 30, 60.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Cambio de forro', 'Reemplazo completo del forro interior', 180, 380.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Poner medio forro', 'Instalación parcial de forro interior', 90, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Cortar vestido en dos piezas', 'Transformación de vestido a conjunto de dos piezas', 60, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Dobladillo a máquina con piezas extras', 'Ajuste de largo con aplicaciones decorativas', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Poner pedrería', 'Aplicación de pedrería decorativa', 60, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Reforzar broches', 'Costura de refuerzo en broches existentes', 15, 45.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true),
    ('Reforzar botones', 'Costura de refuerzo en botones existentes', 20, 70.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Vestido'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- chamarra (22 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajustes de costados', 'Ajuste en los laterales de la chamarra', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Ajuste de costados con mangas', 'Ajuste lateral y de ancho de mangas', 60, 150.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Ajustes de costados con mangas y puños', 'Ajuste lateral mangas y ajuste de puños', 90, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Ajustes de puños por hombro', 'Ajuste de posición de puños modificando desde el hombro', 60, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de cierre de metal', 'Reemplazo de cremallera metálica principal', 60, 180.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cortar dobladillo', 'Ajuste y reducción del largo de la chamarra', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Quitar gorra', 'Remoción de la capucha y cerrado de costura', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de elástico de puños', 'Reemplazo de la banda elástica en los puños', 30, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de elástico de ruedo', 'Reemplazo de la banda elástica en el borde inferior', 45, 130.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de elástico de ruedo y puños', 'Reemplazo de bandas elásticas inferior y en puños', 60, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de cuello', 'Reemplazo o reparación del cuello', 45, 70.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Poner coderas', 'Aplicación de parches protectores en los codos', 30, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Recoser bolsas', 'Reparación de costuras sueltas o rotas en los bolsillos', 20, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Poner bolsas nuevas', 'Confección e instalación de bolsillos nuevos', 60, 170.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Quitar mangas y colocar vistas', 'Retiro de mangas para convertir en chaleco y detallado de sisas', 90, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Recoser de roto en varios lados', 'Reparación general de desgarres o roturas en múltiples áreas', 45, 60.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de cierre de bolsas', 'Reemplazo de cremalleras en los bolsillos', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Poner broches', 'Instalación de broches a presión', 10, 10.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Poner cierres con broches de presión', 'Instalación de cremallera combinada con botones a presión', 90, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cierre de naylon', 'Reemplazo de cremallera principal de nylon', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de cierre nylon', 'Reemplazo de cremallera principal de nylon', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true),
    ('Cambio de cierre nylon especial', 'Reemplazo de cremallera de nylon de características especiales', 60, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Chamarra'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- abrigo (8 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajustes de costados', 'Ajuste en los laterales del abrigo', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true),
    ('Ajuste de costados con mangas', 'Ajuste combinado de laterales y mangas', 60, 180.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true),
    ('Ajustes de costados con mangas y ruedo', 'Ajuste lateral mangas y largo', 90, 220.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true),
    ('Ajustes de costados con mangas ruedo y subir hombros', 'Ajuste completo de abrigo', 120, 285.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true),
    ('Dobladillo a maquina', 'Ajuste de largo cosido a máquina', 30, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true),
    ('Dobladillo de puños', 'Ajuste de largo en los puños', 30, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true),
    ('Subir hombros', 'Ajuste para subir la costura de los hombros', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true),
    ('Subir hombros y puños', 'Ajuste combinado de hombros y posición de puños', 60, 185.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Abrigo'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- licras (8 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Recoser tiro', 'Reparación de costura en el tiro', 15, 30.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true),
    ('Recoser tiro y piernas', 'Reparación de costuras en tiro y piernas', 30, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true),
    ('Recoser piernas', 'Reparación de costura en las piernas', 20, 45.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true),
    ('Cortar ruedo y dobladillo a maquina', 'Reducción de largo y dobladillo a máquina', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true),
    ('Poner elástico', 'Instalación o reemplazo de banda elástica', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true),
    ('Ajustar contornos piernas', 'Ajuste para ceñir las piernas', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true),
    ('Ajustar cintura', 'Ajuste para reducir la cintura', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true),
    ('Ajustar entrepiernas', 'Ajuste de la zona de entrepierna', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Licras'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- playera (12 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajustes de costados', 'Ajuste en los laterales de la playera', 30, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Ajuste de costados con dobladillo', 'Ajuste lateral y de largo', 45, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Dobladillo a maquina', 'Ajuste de largo cosido a máquina', 15, 85.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Dobladillo a maquina con aberturas', 'Ajuste de largo con acabado de aberturas laterales', 30, 110.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Ajustes de costados con abertura', 'Ajuste lateral manteniendo o creando abertura', 45, 95.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Ajustes de costados con abertura y bies', 'Ajuste lateral con acabado de bies en aberturas', 60, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Ajustes de costados con mangas', 'Ajuste combinado de laterales y mangas', 60, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Ajuste de costados con dobladillo y mangas', 'Ajuste completo de laterales largo y mangas', 75, 175.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Subir tirantes', 'Ajuste para acortar tirantes', 15, 70.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Ajuste de hombros', 'Ajuste en la costura superior de los hombros', 30, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Colocar parche', 'Aplicación de un parche en zona dañada', 15, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true),
    ('Colocar parches', 'Aplicación de múltiples parches', 30, 45.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Playera'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- pans (19 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Dobladillo a maquina', 'Ajuste de largo cosido a máquina', 15, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Poner cierre en bolsas', 'Instalación de cierre en bolsillos del pantalón', 30, 110.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Hacer dobladillo a máquina con cierre', 'Ajuste de largo con acabado de cierre en los bajos', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Cambio de cierre en dobladillo', 'Reemplazo de la cremallera ubicada en el dobladillo', 30, 130.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Recoser costados', 'Reparación de costuras laterales sueltas', 20, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Recoser tiro', 'Reparación de costura en la zona del tiro', 15, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Recoser tiro con costado', 'Reparación combinada de costuras en tiro y laterales', 30, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Poner parches', 'Aplicación de parches en zonas desgastadas o rotas', 30, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Cambio de elástico de ruedo', 'Reemplazo de la banda elástica en los puños o bajo', 30, 110.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Recoser rotos en varios lados', 'Reparación general de múltiples desgarres', 45, 75.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Cambio de cierre de bolsas', 'Reemplazo de cremalleras en bolsillos', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Poner broches', 'Instalación de botones de presión o broches', 10, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Poner cierres con broches de presión', 'Instalación de cierre y refuerzo con broches', 60, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Ajustar piernas', 'Reducción del ancho de las piernas', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Ajustar piernas con entrepiernas', 'Ajuste de ancho incluyendo la costura de entrepierna', 60, 110.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Colocar resorte en dobladillo', 'Instalación de banda elástica en el borde inferior', 30, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Colocar resorte al centro', 'Instalación de banda elástica en la cintura', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Línea en costados', 'Aplicación de franja decorativa o refuerzo lateral', 45, 130.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true),
    ('Cambiar bolsas', 'Reemplazo de los fondos de los bolsillos', 60, 170.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Pans'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- short (10 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Ajustes de cintura', 'Reducción o ampliación de la cintura del short', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Ajuste de costados', 'Ajuste en los laterales para mejorar el entalle', 30, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Ajustes de cintura con dobladillo', 'Ajuste de cintura y largo del short', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Ajustes de cintura con costados', 'Ajuste combinado de cintura y laterales', 60, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Ajustes de cintura con costados y dobladillo', 'Ajuste integral de cintura laterales y largo', 75, 190.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Cambio de bolsas', 'Reemplazo de los fondos de los bolsillos', 60, 135.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Poner botón', 'Instalación de botón', 5, 10.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Aumentar pretina talla', 'Ampliación de la pretina para aumentar una talla', 45, 145.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Colocar cuchillas para aumento', 'Inserción de piezas de tela para ganar amplitud', 60, 160.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true),
    ('Dobladillo a maquina', 'Ajuste de largo cosido a máquina', 15, 80.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Short'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- Tier 3: household and miscellaneous items

-- cojín (2 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Coser cojín', 'Costura general para cierre o reparación de cojín', 30, 30.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Cojín'), true),
    ('Poner cierre a cojín', 'Instalación de cierre en cojín', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Cojín'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- bolsa (2 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Poner cierre a bolsa', 'Instalación de cierre en bolsa o bolso', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Bolsa'), true),
    ('Cambio de cierre en bolsas', 'Reemplazo de la cremallera en bolsa o bolso', 45, 95.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Bolsa'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- sábanas (1 service)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Recoser sabanas', 'Reparación de costuras o rasgaduras en sábanas', 20, 50.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Sábanas'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- toalla (2 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Recoser toallas en orillas', 'Reparación de las orillas deshilachadas de toallas', 15, 45.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Toalla'), true),
    ('Poner bies en toalla grande o chica', 'Aplicación de cinta bies en el contorno de la toalla', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Toalla'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- peluche (1 service)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Recoser muñeco de peluche', 'Reparación de costuras o relleno en peluche', 20, 40.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Peluche'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- tapete (1 service)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Pasar over a tapete', 'Costura de overlock en las orillas del tapete', 30, 70.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Tapete'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- faja (3 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Aumentar tela a faja', 'Ampliación de faja añadiendo tela', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Faja'), true),
    ('Cambio de cierre a faja', 'Reemplazo de cremallera en faja', 45, 130.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Faja'), true),
    ('Repasar costura a faja', 'Refuerzo de las costuras existentes en la faja', 15, 35.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Faja'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- cobija (1 service)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Dobladillar cobijas', 'Ajuste de bordes y creación de dobladillo en cobijas', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Cobija'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- calcetines (1 service)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Recoser calcetines', 'Reparación de agujeros o costuras en calcetines', 15, 25.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Calcetines'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- ropa interior (1 service)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Recoser Boxer de elástico', 'Ajuste o reparación del resorte en ropa interior', 15, 25.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Ropa Interior'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- corbata (2 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Cortar corbatas de largo', 'Reducción del largo de la corbata', 30, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Corbata'), true),
    ('Reducir ancho corbata', 'Modificación lateral para adelgazar la corbata', 45, 90.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Corbata'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- cortina (1 service)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Dobladillo de cortinas', 'Ajuste del largo de las cortinas', 45, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Cortina'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- mantel (2 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Dobladillo mantel a maquina', 'Costura de bordes a máquina para mantel', 45, 120.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Mantel'), true),
    ('Poner bies a mantel', 'Aplicación de cinta bies decorativa en el contorno', 60, 100.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Mantel'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- varios (2 services)
INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
    ('Botón', 'Instalación o reemplazo de un botón suelto', 5, 10.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Varios'), true),
    ('Ojal', 'Confección o reparación de ojal para botón', 15, 10.00, (SELECT id_garment_type FROM cci_garment_type WHERE name = 'Varios'), true)
ON CONFLICT ON CONSTRAINT uq_service_name_garment_type DO UPDATE SET
    description = EXCLUDED.description,
    default_duration_min = EXCLUDED.default_duration_min,
    base_price = EXCLUDED.base_price,
    updated_at = NOW();

-- ============================================================
-- 5. DEFAULT PRICE LIST
-- ============================================================
INSERT INTO tcc_price_list (name, valid_from, is_active, priority)
SELECT 'Lista General 2026', '2026-01-01'::TIMESTAMPTZ, true, 10
WHERE NOT EXISTS (
    SELECT 1 FROM tcc_price_list WHERE name = 'Lista General 2026'
);

-- ============================================================
-- 6. PRICE LIST ITEMS — link all active services to the default price list
-- ============================================================
INSERT INTO tcc_price_list_item (id_price_list, id_service, price)
SELECT
    pl.id_price_list,
    s.id_service,
    s.base_price
FROM cci_service s
CROSS JOIN tcc_price_list pl
WHERE pl.name = 'Lista General 2026'
  AND s.is_deleted = false
  AND s.is_active = true
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
