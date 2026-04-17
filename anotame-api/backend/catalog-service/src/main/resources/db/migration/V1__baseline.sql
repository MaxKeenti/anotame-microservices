-- catalog-service V1 baseline
-- Owns: cci_garment_type, cci_service, tcc_price_list, tcc_price_list_item
-- No incremental migrations exist for this service.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE cci_garment_type (
    id_garment_type UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    is_deleted      BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE cci_service (
    id_service          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    description         VARCHAR(255),
    id_garment_type     UUID REFERENCES cci_garment_type(id_garment_type),
    default_duration_min INTEGER DEFAULT 30,
    base_price          NUMERIC(19,4) DEFAULT 0.0,
    is_active           BOOLEAN DEFAULT TRUE NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    is_deleted          BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tcc_price_list (
    id_price_list UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    valid_from    TIMESTAMPTZ NOT NULL,
    valid_to      TIMESTAMPTZ,
    is_active     BOOLEAN DEFAULT TRUE NOT NULL,
    priority      INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE TABLE tcc_price_list_item (
    id_price_list_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_price_list      UUID NOT NULL REFERENCES tcc_price_list(id_price_list),
    id_service         UUID NOT NULL REFERENCES cci_service(id_service),
    price              NUMERIC(19,4) NOT NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);
