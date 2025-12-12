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
    deleted_at TIMESTAMPTZ -- Soft Delete
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
    deleted_at TIMESTAMPTZ
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
    deleted_at TIMESTAMPTZ
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
CREATE TABLE tco_order_item (
    id_order_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    id_garment_type UUID NOT NULL REFERENCES cci_garment_type(id_garment_type),
    
    quantity INT DEFAULT 1 NOT NULL,
    description TEXT,
    item_status VARCHAR(50) DEFAULT 'PENDING', -- Granular status per item
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Item Service (tco_item_service)
CREATE TABLE tco_item_service (
    id_item_service UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order_item UUID NOT NULL REFERENCES tco_order_item(id_order_item) ON DELETE CASCADE,
    id_service UUID NOT NULL REFERENCES cci_service(id_service),
    
    -- Financial Snapshot
    quoted_price DECIMAL(19,4) NOT NULL,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================================================================
-- INDEXES & SEEDS
-- =========================================================================================

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
