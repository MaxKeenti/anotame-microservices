-- Anotame Redesigned Schema (PostgreSQL) - Microservices Architecture
-- Contexts: Identity (tca), Operations (tce), Catalog (cci/cca), Sales (tco)
-- Standards: UUIDs, Soft Deletes (deleted_at), Audit Logs

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================================================================================
-- 1. CATALOG CONTEXT (Generic Config)
-- =========================================================================================

-- Roles (cca_role)
CREATE TABLE cca_role (
    id_role UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE, -- 'ADMIN', 'EMPLOYEE'
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft Delete
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Service/Repair (cci_service)
CREATE TABLE cci_service (
    id_service UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE, -- 'HEMMING'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_duration_min INT DEFAULT 30,
    base_price DECIMAL(19,4) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Garment Type (cci_garment_type)
CREATE TABLE cci_garment_type (
    id_garment_type UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE, -- 'PANTS'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Price Lists (tcc_price_list)
CREATE TABLE tcc_price_list (
    id_price_list UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ, -- Null = Forever
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    priority INT DEFAULT 0, -- Higher wins
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Price List Items (tcc_price_list_item)
CREATE TABLE tcc_price_list_item (
    id_price_list_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_price_list UUID NOT NULL REFERENCES tcc_price_list(id_price_list),
    id_service UUID NOT NULL REFERENCES cci_service(id_service),
    price DECIMAL(19,4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================================
-- 2. IDENTITY CONTEXT (Auth & Employees)
-- =========================================================================================

-- Internal Users / Employees (tca_user)
-- Note: Customers are NOT here. This is for system access.
CREATE TABLE tca_user (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_role UUID NOT NULL REFERENCES cca_role(id_role),
    username VARCHAR(100) NOT NULL UNIQUE,
    email CITEXT UNIQUE, 
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Audit
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================================================================
-- 3. ESTABLISHMENT CONTEXT (Operations)
-- =========================================================================================

-- Establishment (tce_establishment)
CREATE TABLE tce_establishment (
    id_establishment UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    tax_info JSONB, -- { "rfc": "...", "regime": "..." }
    owner_name VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Branch (tce_branch)
CREATE TABLE tce_branch (
    id_branch UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_establishment UUID NOT NULL REFERENCES tce_establishment(id_establishment),
    name VARCHAR(150) NOT NULL,
    location GEOMETRY(Point, 4326),
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Employee -> Branch Assignment (tce_employee_assignment)
CREATE TABLE tce_employee_assignment (
    id_assignment UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tca_user(id_user), -- Link to Identity
    id_branch UUID NOT NULL REFERENCES tce_branch(id_branch),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(id_user, id_branch)
);

-- =========================================================================================
-- 4. SALES CONTEXT (Orders & Customers)
-- =========================================================================================

-- Customers (tco_customer)
-- Separated from Identity Users. These are profiles managed by the store.
CREATE TABLE tco_customer (
    id_customer UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(30),
    email CITEXT,
    preferences JSONB, -- { "starch": "heavy", "contact_method": "whatsapp" }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Order (tco_order)
CREATE TABLE tco_order (
    id_order UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_branch INT NOT NULL, -- Sequential ID logic handled by App
    id_branch UUID NOT NULL REFERENCES tce_branch(id_branch),
    
    -- Actors
    id_customer UUID NOT NULL REFERENCES tco_customer(id_customer),
    created_by_user_id UUID NOT NULL, -- Logical Reference to Identity Service (Employee)
    
    -- Snapshots (Reliability)
    customer_snapshot JSONB, -- Copy of customer details at time of order
    
    -- Financials
    total_amount DECIMAL(19,4) NOT NULL DEFAULT 0.0,
    currency VARCHAR(3) DEFAULT 'MXN',
    
    -- Status
    current_status VARCHAR(50) DEFAULT 'RECEIVED', -- Current state pointer
    
    -- Workflow Dates
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    promised_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Order History (tco_order_history) - NEW: Finite State Machine tracking
CREATE TABLE tco_order_history (
    id_history UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id UUID, -- Who changed it?
    notes TEXT, -- Reason for change (e.g., "Customer delayed pickup")
    created_at TIMESTAMPTZ DEFAULT NOW() -- When did the change happen?
);

-- Order Item (tco_order_item)
-- Synced with Java Entity: 1 Item = 1 Garment + 1 Service
CREATE TABLE tco_order_item (
    id_order_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    id_garment_type UUID NOT NULL REFERENCES cci_garment_type(id_garment_type),
    id_service UUID NOT NULL REFERENCES cci_service(id_service), -- Added to match logic
    
    service_name VARCHAR(150),
    garment_name VARCHAR(150),
    
    quantity INT DEFAULT 1 NOT NULL,
    unit_price DECIMAL(19,4) NOT NULL, -- Base/List price snapshot
    subtotal DECIMAL(19,4) NOT NULL,
    
    -- Ad-Hoc Adjustments
    adjustment_amount DECIMAL(19,4) DEFAULT 0.0, -- +/- Value
    adjustment_reason VARCHAR(255),
    
    notes TEXT,
    item_status VARCHAR(50) DEFAULT 'PENDING',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- tco_item_service deprecated in favor of unified tco_order_item model

-- =========================================================================================
-- INDEXES & SEEDS
-- =========================================================================================
-- Seed Establishment
INSERT INTO tce_establishment (id_establishment, name, is_active) VALUES ('b8c6e2a1-7d3f-4e5a-9c8b-1a2f3d4e5f6a', 'Anotame Inc.', true);

-- Seed Branch
INSERT INTO tce_branch (id_branch, id_establishment, name, is_active) VALUES ('ea22f4a4-5504-43d9-92f9-30cc17b234d1', 'b8c6e2a1-7d3f-4e5a-9c8b-1a2f3d4e5f6a', 'Main Branch', true);

CREATE INDEX idx_order_customer ON tco_order(id_customer);
CREATE INDEX idx_order_status ON tco_order(current_status);
CREATE INDEX idx_order_history_order ON tco_order_history(id_order);

-- Genders/Roles removed here as Genders might be less relevant for strict auth, 
-- and Roles are now specific to the Identity Context.

-- Seed: Roles
INSERT INTO cca_role (code, name) VALUES ('ADMIN', 'Administrator'), ('EMPLOYEE', 'Staff');

-- Seed: Garments
INSERT INTO cci_garment_type (code, name) VALUES ('PANTS', 'Pants'), ('SHIRT', 'Shirt');

-- Seed: Services
INSERT INTO cci_service (code, name, base_price) VALUES ('HEMMING', 'Hemming', 50.00);
