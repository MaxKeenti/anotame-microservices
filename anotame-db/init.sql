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
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
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

-- Work Days (top_work_day)
CREATE TABLE top_work_day (
    id_work_day UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    is_open BOOLEAN DEFAULT TRUE NOT NULL,
    open_time TIME DEFAULT '09:00:00',
    close_time TIME DEFAULT '18:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week)
);

-- Holidays (top_holiday)
CREATE TABLE top_holiday (
    id_holiday UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts (top_shift)
CREATE TABLE top_shift (
    id_shift UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tca_user(id_user),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
INSERT INTO tce_establishment (id_establishment, name, is_active) VALUES ('b8c6e2a1-7d3f-4e5a-9c8b-1a2f3d4e5f6a', 'El Hilvan', true);

-- Seed Branch
INSERT INTO tce_branch (id_branch, id_establishment, name, is_active) VALUES ('ea22f4a4-5504-43d9-92f9-30cc17b234d1', 'b8c6e2a1-7d3f-4e5a-9c8b-1a2f3d4e5f6a', 'Oaxaca #113 Local C, Col. Heroes de Padierna, La Magdalena Contreras, CDMX', true);

CREATE INDEX idx_order_customer ON tco_order(id_customer);
CREATE INDEX idx_order_status ON tco_order(current_status);
CREATE INDEX idx_order_history_order ON tco_order_history(id_order);

-- Genders/Roles removed here as Genders might be less relevant for strict auth, 
-- and Roles are now specific to the Identity Context.

-- Seed: Roles
-- Seed: Roles with Fixed IDs for referencing
INSERT INTO cca_role (id_role, code, name) VALUES 
('11111111-1111-1111-1111-111111111111', 'ADMIN', 'Administrator'),
('22222222-2222-2222-2222-222222222222', 'EMPLOYEE', 'Staff')
ON CONFLICT (code) DO NOTHING;

-- Seed: Admin User (password: 'admin')
-- Requires pgcrypto extension enabled at top of file
INSERT INTO tca_user (id_user, id_role, username, email, password_hash, first_name, last_name) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', 'admin@anotame.com', crypt('admin', gen_salt('bf')), 'System', 'Admin')
ON CONFLICT (username) DO NOTHING;

-- Seed: Garments
INSERT INTO cci_garment_type (id_garment_type, code, name, description) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GT-PANT', 'Pantalón o Jeans', 'Arreglos para pantalones y jeans de mezclilla'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'GT-BLUSA', 'Blusa', 'Arreglos para blusas'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'GT-FALDA', 'Falda', 'Arreglos para faldas'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'GT-SACO', 'Saco de Hombre', 'Sastrería para sacos y blazers'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'GT-VAR', 'Piezas Varias', 'Arreglos del hogar y otros')
ON CONFLICT (code) DO NOTHING;

-- Seed: Price List
INSERT INTO tcc_price_list (id_price_list, name, valid_from, priority, is_active) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Lista Estándar 2026', NOW(), 1, true);

-- Seed: Services & Prices
-- Helper function not used, standard raw SQL inserts with hardcoded UUIDs for consistency.
-- We use a DO block to insert services and link them to the price list dynamically to avoid UUID hell.
DO $$
DECLARE
    v_price_list_id UUID := 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';
    v_service_id UUID;
BEGIN
    -- PANTALON
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-01', 'Ajuste de cintura', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-02', 'Ajuste de costado', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-03', 'Ajuste de piernas', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-04', 'Dobladillo a mano', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-05', 'Dobladillo a máquina', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-06', 'Cambio de cierre (Nylon/Invisible)', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-07', 'Cambio de cierre (Metal)', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-08', 'Ajuste de cintura con costado', 95) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 95);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-09', 'Ajuste de piernas con dobladillo', 95) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 95);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-10', 'Ajuste de cintura con costado y dobladillo', 120) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 120);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-12', 'Poner parche', 45) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 45);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-13', 'Cambio de bolsa', 55) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 55);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-14', 'Cambio de bolsas (par)', 110) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 110);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-15', 'Poner falso en pretina', 75) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 75);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-16', 'Ajuste de costados y cintura (Quitar pinzas)', 220) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 220);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-17', 'Recoser tiro', 30) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 30);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-PANT-18', 'Cambio de forro', 150) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 150);

    -- BLUSA
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-BLU-01', 'Ajuste de costados', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-BLU-02', 'Ajuste de mangas', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-BLU-03', 'Ajuste de hombro', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-BLU-04', 'Dobladillo de ruedo', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-BLU-05', 'Ajuste de manga con puño', 110) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 110);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-BLU-06', 'Cortar mangas', 90) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 90);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-BLU-07', 'Colocar broches', 10) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 10);

    -- FALDA
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-FAL-01', 'Ajuste de cintura', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-FAL-02', 'Ajuste de costado', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-FAL-03', 'Dobladillo a mano sin forro', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-FAL-04', 'Dobladillo a máquina sin forro', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-FAL-05', 'Dobladillo con forro', 90) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 90);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-FAL-06', 'Cambio de cierre', 65) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 65);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-FAL-07', 'Aumentar pretina', 95) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 95);

    -- SACO
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-SACO-01', 'Ajuste de costados', 110) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 110);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-SACO-02', 'Ajuste de mangas', 75) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 75);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-SACO-03', 'Subir puños', 95) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 95);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-SACO-04', 'Ajuste de centro', 110) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 110);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-SACO-05', 'Ajuste de hombro', 110) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 110);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-SACO-06', 'Cambio de forro completo', 200) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 200);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-SACO-07', 'Ajuste de solapa', 110) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 110);

    -- VARIOS
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-VAR-01', 'Coser cojín', 50) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 50);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-VAR-02', 'Poner cierre a cojín', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);

    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-VAR-03', 'Recoser sábanas', 60) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 60);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-VAR-04', 'Cambio de cierre en bolsas', 75) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 75);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-VAR-05', 'Recoser muñeco de peluche', 40) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 40);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-VAR-06', 'Dobladillar cobijas', 80) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 80);
    
    INSERT INTO cci_service (code, name, base_price) VALUES ('SRV-VAR-07', 'Dobladillo de cortinas', 75) RETURNING id_service INTO v_service_id;
    INSERT INTO tcc_price_list_item (id_price_list, id_service, price) VALUES (v_price_list_id, v_service_id, 75);

END $$;
