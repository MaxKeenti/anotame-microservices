-- operations-service V1 baseline (consolidated: V1 + V2)
-- Owns: tce_establishment, tce_branch, tce_employee_assignment,
--       top_work_day, top_holiday, top_shift,
--       tco_work_order, tco_work_order_item
-- Cross-service FKs dropped: top_shift.id_user, tce_employee_assignment.id_user
-- V2 changes folded in: primary_color and font_family on tce_establishment

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE tce_establishment (
    id_establishment       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                   VARCHAR(255) NOT NULL,
    tax_info               JSONB,
    owner_name             VARCHAR(255),
    is_active              BOOLEAN DEFAULT TRUE NOT NULL,
    daily_capacity_minutes INTEGER,
    primary_color          VARCHAR(7),
    font_family            VARCHAR(32),
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW(),
    deleted_at             TIMESTAMPTZ
);

CREATE TABLE tce_branch (
    id_branch        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_establishment UUID NOT NULL REFERENCES tce_establishment(id_establishment),
    name             VARCHAR(150) NOT NULL,
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    timezone         VARCHAR(50) DEFAULT 'America/Mexico_City',
    is_active        BOOLEAN DEFAULT TRUE NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE TABLE tce_employee_assignment (
    id_assignment UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user       UUID NOT NULL,
    id_branch     UUID NOT NULL REFERENCES tce_branch(id_branch),
    start_date    DATE DEFAULT CURRENT_DATE,
    end_date      DATE,
    is_active     BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (id_user, id_branch)
);

CREATE TABLE top_work_day (
    id_work_day  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week  INTEGER NOT NULL UNIQUE,
    is_open      BOOLEAN DEFAULT TRUE NOT NULL,
    open_time    TIME DEFAULT '09:00:00',
    close_time   TIME DEFAULT '18:00:00',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT top_work_day_day_of_week_check CHECK (day_of_week >= 1 AND day_of_week <= 7)
);

CREATE TABLE top_holiday (
    id_holiday    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date  DATE NOT NULL UNIQUE,
    description   VARCHAR(255),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE top_shift (
    id_shift    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user     UUID NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT top_shift_day_of_week_check CHECK (day_of_week >= 1 AND day_of_week <= 7)
);

CREATE TABLE tco_work_order (
    id_work_order UUID PRIMARY KEY,
    id_order      UUID NOT NULL,
    status        VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tco_work_order_item (
    id_work_order_item  UUID PRIMARY KEY,
    id_work_order       UUID NOT NULL REFERENCES tco_work_order(id_work_order),
    id_sales_order_item UUID NOT NULL,
    service_name        VARCHAR(255) NOT NULL,
    current_stage       VARCHAR(255) NOT NULL,
    notes               VARCHAR(255)
);
