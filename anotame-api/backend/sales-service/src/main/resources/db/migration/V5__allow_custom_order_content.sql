ALTER TABLE tco_order_item
    ADD COLUMN garment_source VARCHAR(20) NOT NULL DEFAULT 'CATALOG',
    ALTER COLUMN id_garment_type DROP NOT NULL;

ALTER TABLE tco_order_item_service
    ADD COLUMN service_source VARCHAR(20) NOT NULL DEFAULT 'CATALOG',
    ADD COLUMN instructions TEXT,
    ALTER COLUMN id_service DROP NOT NULL;

ALTER TABLE tco_order_item
    ADD CONSTRAINT ck_order_item_garment_source_reference
    CHECK (
        (garment_source = 'CATALOG' AND id_garment_type IS NOT NULL)
        OR (garment_source = 'CUSTOM' AND id_garment_type IS NULL)
    );

ALTER TABLE tco_order_item_service
    ADD CONSTRAINT ck_order_item_service_source_reference
    CHECK (
        (service_source = 'CATALOG' AND id_service IS NOT NULL)
        OR (service_source = 'CUSTOM' AND id_service IS NULL)
    );
