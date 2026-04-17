-- sales-service V1 baseline (consolidated: V1 + V2 + V3 + V4)
-- Owns: tco_customer, tco_order, tco_order_item, tco_order_item_service,
--       tco_order_history, tco_order_audit_log, tco_ticket_number_seq
-- Cross-service FKs dropped: id_garment_type, id_service, id_branch
-- Status columns consolidated: current_status removed, status kept as VARCHAR(50)
-- branch_name snapshot column added per DB-03

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE SEQUENCE tco_ticket_number_seq
    START WITH 1
    INCREMENT BY 1
    NO CYCLE;

CREATE TABLE tco_customer (
    id_customer  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name   VARCHAR(255) NOT NULL,
    last_name    VARCHAR(255),
    phone_number VARCHAR(255),
    email        VARCHAR(255),
    preferences  JSONB,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    is_deleted   BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tco_order (
    id_order            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_branch        INTEGER NOT NULL,
    id_branch           UUID NOT NULL,
    branch_name         VARCHAR(150),
    id_customer         UUID NOT NULL REFERENCES tco_customer(id_customer),
    created_by_user_id  UUID NOT NULL,
    customer_snapshot   JSONB,
    total_amount        NUMERIC(19,4) DEFAULT 0.0 NOT NULL,
    currency            VARCHAR(3) DEFAULT 'MXN',
    amount_paid         NUMERIC(19,4) DEFAULT 0.0,
    payment_method      VARCHAR(255),
    status              VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    ticket_number       VARCHAR(255) UNIQUE,
    received_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    promised_at         TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    committed_deadline  TIMESTAMPTZ,
    pickup_code         VARCHAR(6),
    price_list_id       UUID,
    price_list_name     VARCHAR(255),
    notes               VARCHAR(255),
    total_duration_min  INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    is_deleted          BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tco_order_item (
    id_order_item   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order        UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    id_garment_type UUID NOT NULL,
    garment_name    VARCHAR(255),
    quantity        INTEGER DEFAULT 1 NOT NULL,
    unit_price      NUMERIC(19,4) DEFAULT 0.0 NOT NULL,
    subtotal        NUMERIC(19,4) NOT NULL,
    notes           VARCHAR(255),
    item_status     VARCHAR(50) DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    is_deleted      BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE tco_order_item_service (
    id_item_service    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order_item      UUID NOT NULL REFERENCES tco_order_item(id_order_item) ON DELETE CASCADE,
    id_service         UUID NOT NULL,
    service_name       VARCHAR(255),
    unit_price         NUMERIC(19,4) NOT NULL,
    adjustment_amount  NUMERIC(19,4) DEFAULT 0.0,
    adjustment_reason  VARCHAR(255),
    duration_min       INTEGER,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tco_order_history (
    id_history          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order            UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    previous_status     VARCHAR(50),
    new_status          VARCHAR(50) NOT NULL,
    changed_by_user_id  UUID,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tco_order_audit_log (
    id_audit    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order    UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    user_id     UUID NOT NULL,
    field_name  VARCHAR(100) NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_customer       ON tco_order(id_customer);
CREATE INDEX idx_order_status         ON tco_order(status);
CREATE INDEX idx_order_history_order  ON tco_order_history(id_order);
CREATE INDEX idx_audit_order          ON tco_order_audit_log(id_order);
