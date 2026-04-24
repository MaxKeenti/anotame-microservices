-- catalog-service V2: seed initial catalog in Spanish
-- Types: Pantalón, Camisa, Chamarra, Vestido, Falda, Traje
-- Services are placeholder data — real prices from business sheets will be added via V3.

DO $$
DECLARE
    v_pantalon UUID;
    v_camisa   UUID;
    v_chamarra UUID;
    v_vestido  UUID;
    v_falda    UUID;
    v_traje    UUID;
BEGIN
    -- Garment types
    INSERT INTO cci_garment_type (name, description)
        VALUES ('Pantalón', 'Pantalones, jeans, chinos')
        RETURNING id_garment_type INTO v_pantalon;

    INSERT INTO cci_garment_type (name, description)
        VALUES ('Camisa', 'Camisas de vestir, playeras, polos')
        RETURNING id_garment_type INTO v_camisa;

    INSERT INTO cci_garment_type (name, description)
        VALUES ('Chamarra', 'Sacos, blazers, abrigos')
        RETURNING id_garment_type INTO v_chamarra;

    INSERT INTO cci_garment_type (name, description)
        VALUES ('Vestido', 'Vestidos casuales y de gala')
        RETURNING id_garment_type INTO v_vestido;

    INSERT INTO cci_garment_type (name, description)
        VALUES ('Falda', 'Faldas cortas, midi y largas')
        RETURNING id_garment_type INTO v_falda;

    INSERT INTO cci_garment_type (name, description)
        VALUES ('Traje', 'Trajes de 2 y 3 piezas')
        RETURNING id_garment_type INTO v_traje;

    -- Services: Pantalón
    INSERT INTO cci_service (name, description, id_garment_type, default_duration_min, base_price)
        VALUES
        ('Ruedo',               'Acortar el largo de la pierna',         v_pantalon, 15, 12.00),
        ('Entallado',           'Reducir el ancho de la pierna',         v_pantalon, 30, 25.00),
        ('Ajuste de cintura',   'Meter o soltar la cintura',             v_pantalon, 30, 20.00),
        ('Cambio de cierre',    'Instalar cierre nuevo',                 v_pantalon, 45, 20.00),
        ('Parche',              'Reparar hoyo o rasgadura',              v_pantalon, 20, 10.00);

    -- Services: Camisa
    INSERT INTO cci_service (name, description, id_garment_type, default_duration_min, base_price)
        VALUES
        ('Cambio de botón',     'Coser botón de repuesto',               v_camisa,   5,  2.00),
        ('Reparación de cuello','Re-coser o reforzar el cuello',         v_camisa,   20, 15.00),
        ('Acortar manga',       'Reducir el largo de manga',             v_camisa,   20, 18.00);

    -- Services: Chamarra
    INSERT INTO cci_service (name, description, id_garment_type, default_duration_min, base_price)
        VALUES
        ('Cambio de cierre',    'Instalar cierre nuevo en chamarra',     v_chamarra, 45, 22.00),
        ('Cambio de forro',     'Reemplazar forro interior',             v_chamarra, 90, 45.00),
        ('Acortar manga',       'Reducir el largo de manga de chamarra', v_chamarra, 30, 25.00);

    -- Services: Vestido
    INSERT INTO cci_service (name, description, id_garment_type, default_duration_min, base_price)
        VALUES
        ('Ruedo',               'Acortar el largo del vestido',          v_vestido,  30, 18.00),
        ('Cambio de cierre',    'Instalar cierre nuevo en vestido',      v_vestido,  45, 20.00),
        ('Entallado',           'Reducir talla en costuras',             v_vestido,  60, 35.00);

    -- Services: Falda
    INSERT INTO cci_service (name, description, id_garment_type, default_duration_min, base_price)
        VALUES
        ('Ruedo',               'Acortar el largo de la falda',          v_falda,    20, 12.00),
        ('Ajuste de cintura',   'Ajustar cintura de falda',              v_falda,    25, 18.00);

    -- Services: Traje
    INSERT INTO cci_service (name, description, id_garment_type, default_duration_min, base_price)
        VALUES
        ('Lavado en seco',      'Limpieza en seco estándar',             v_traje,    1440, 8.00),
        ('Planchado profesional','Planchado a vapor profesional',        v_traje,    60,   15.00),
        ('Ruedo de pantalón',   'Acortar pantalón de traje',             v_traje,    15,   12.00);

END $$;
