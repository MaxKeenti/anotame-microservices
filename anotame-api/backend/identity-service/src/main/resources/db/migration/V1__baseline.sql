-- identity-service V1 baseline
-- Owns: cca_role, tca_user
-- No incremental migrations exist for this service.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

CREATE TABLE cca_role (
    id_role     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    is_active   BOOLEAN DEFAULT TRUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    is_deleted  BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tca_user (
    id_user         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_role         UUID NOT NULL REFERENCES cca_role(id_role),
    username        VARCHAR(255) NOT NULL UNIQUE,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    is_deleted      BOOLEAN DEFAULT FALSE NOT NULL
);
