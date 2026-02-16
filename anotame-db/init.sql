-- Anotame Redesigned Schema (PostgreSQL) - Microservices Architecture
-- Contexts: Identity (tca), Operations (tce), Catalog (cci/cca), Sales (tco)
-- Standards: UUIDs, Soft Deletes (deleted_at), Audit Logs

CREATE EXTENSION IF NOT EXISTS pgcrypto;
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

-- Garment Type (cci_garment_type)
CREATE TABLE cci_garment_type (
    id_garment_type UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Service/Repair (cci_service)
CREATE TABLE cci_service (
    id_service UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    id_garment_type UUID REFERENCES cci_garment_type(id_garment_type),
    default_duration_min INT DEFAULT 30,
    base_price DECIMAL(19,4) DEFAULT 0.0,
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
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
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
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL -- Soft Delete required by CustomerEntity
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
    amount_paid DECIMAL(19,4) DEFAULT 0.0,
    payment_method VARCHAR(50),
    
    -- Status
    current_status VARCHAR(50) DEFAULT 'RECEIVED', -- Current state pointer
    
    -- Workflow Dates
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    promised_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    committed_deadline TIMESTAMPTZ, -- Field required by OrderEntity
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL -- Soft Delete required by OrderEntity
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
    
    garment_name VARCHAR(150),
    
    quantity INT DEFAULT 1 NOT NULL,
    unit_price DECIMAL(19,4) NOT NULL DEFAULT 0.0, -- Added to match production
    subtotal DECIMAL(19,4) NOT NULL, -- Sum of (services price * quantity)
    
    notes TEXT,
    item_status VARCHAR(50) DEFAULT 'PENDING',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Order Item Service (tco_order_item_service)
CREATE TABLE tco_order_item_service (
    id_item_service UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order_item UUID NOT NULL REFERENCES tco_order_item(id_order_item) ON DELETE CASCADE,
    id_service UUID NOT NULL REFERENCES cci_service(id_service),
    
    service_name VARCHAR(150),
    
    unit_price DECIMAL(19,4) NOT NULL, -- Base price snapshot for this service
    
    -- Ad-Hoc Adjustments per service
    adjustment_amount DECIMAL(19,4) DEFAULT 0.0,
    adjustment_reason VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
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
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pantalón o Jeans', 'Arreglos para pantalones y jeans de mezclilla', true, '2026-02-16 00:31:29.168438+00', '2026-02-16 00:31:29.168438+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Blusa', 'Arreglos para blusas', true, '2026-02-16 00:31:29.168438+00', '2026-02-16 00:31:29.168438+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Falda', 'Arreglos para faldas', true, '2026-02-16 00:31:29.168438+00', '2026-02-16 00:31:29.168438+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Saco de Hombre', 'Sastrería para sacos y blazers', true, '2026-02-16 00:31:29.168438+00', '2026-02-16 00:31:29.168438+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Piezas Varias', 'Arreglos del hogar y otros', true, '2026-02-16 00:31:29.168438+00', '2026-02-16 00:31:29.168438+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('791e2450-a497-4449-82c8-bd689ab8660e', 'Short', 'Pantalón corto', true, '2026-02-16 01:13:13.008167+00', '2026-02-16 01:13:13.00823+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('89a5d13b-3831-4286-b2db-f51583c2a7ae', 'Pans', 'pantalon deportivo', true, '2026-02-16 01:17:22.522667+00', '2026-02-16 01:17:22.522697+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('347fc9df-98b0-43c2-883d-b9102d747569', 'Brasier', 'Prenda intima para el busto', true, '2026-02-16 01:47:41.948555+00', '2026-02-16 01:47:41.948597+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('eebb8410-2cd5-4040-8154-b5375a541b1b', 'Vestido', 'Prenda de vestir completo', true, '2026-02-16 02:00:57.487036+00', '2026-02-16 02:00:57.487065+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 'Gabardina', 'Tipo saco largo', true, '2026-02-16 02:13:28.129296+00', '2026-02-16 02:13:28.129324+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('f24adf69-1935-41bc-b69f-4362abb267b8', 'Palapzo', 'Penda completa', true, '2026-02-16 02:47:24.90815+00', '2026-02-16 02:47:24.908171+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('455698ba-9bc6-4a8a-9a07-7f67535b1c0e', 'Palapzo', 'Prenda completa', false, '2026-02-16 02:44:44.625308+00', '2026-02-16 02:47:46.147797+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_garment_type (id_garment_type, name, description, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('9e2d6930-88d3-4628-a466-4897bbd1dd17', 'Chamarra', 'Prenda corta de manga larga', true, '2026-02-16 03:29:47.424599+00', '2026-02-16 03:29:47.424634+00', NULL, false) ON CONFLICT DO NOTHING;

-- Seed: Price List
INSERT INTO public.tcc_price_list (id_price_list, name, valid_from, valid_to, is_active, priority, created_at, updated_at, deleted_at) VALUES ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Lista Estándar 2026', '2026-02-16 00:00:00+00', NULL, true, 1, '2026-02-16 00:31:29.169601+00', '2026-02-16 01:44:22.885496+00', NULL) ON CONFLICT DO NOTHING;

-- Seed: Services & Prices
-- Helper function not used, standard raw SQL inserts with hardcoded UUIDs for consistency.
-- We use a DO block to insert services and link them to the price list dynamically to avoid UUID hell.
-- Seed: Services
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('255705ed-9fd8-4dea-8137-05ebecca31a8', 'Ajuste de cintura', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('2c79444d-ec01-4b58-9c4b-fb1f991be2b3', 'Ajuste de costado', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('e4279d84-5600-4342-a1f7-f785b6a0fc0e', 'Ajuste de piernas', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('9cf991c7-0fb6-44e7-92cb-70a9a87f3e34', 'Dobladillo a mano', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('403c51d8-8c57-4f8b-b678-48cdc47018e7', 'Dobladillo a máquina', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('20e6aaea-4f11-48d7-9bb1-4feb10d55401', 'Cambio de cierre (Nylon/Invisible)', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('713fdee8-ee9d-4cef-af0b-cde5e3bdb577', 'Cambio de cierre (Metal)', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('cc5ee366-deda-4617-8cf5-7e50516ffbe7', 'Ajuste de cintura con costado', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 95.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('d86c0b05-f655-4d1b-aad7-a9b178b61c2b', 'Ajuste de piernas con dobladillo', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 95.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('facfca1d-0e66-450e-87db-e51aae877d23', 'Ajuste de cintura con costado y dobladillo', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 120.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('eb59342d-3d87-4303-a305-edf13c639a7c', 'Poner parche', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 45.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('dd6f3064-bbf8-4465-8124-15e4b7fb9ce8', 'Cambio de bolsa', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 55.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('b013ab81-0f45-43f2-a376-e8659f4ed4d9', 'Cambio de bolsas (par)', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 110.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('21e0f3e6-84cd-461e-8d32-72b94a09ebf6', 'Poner falso en pretina', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 75.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('4cbe4f4a-fab7-4980-a351-a2cbbe650e15', 'Ajuste de costados y cintura (Quitar pinzas)', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 220.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('fdbd8fdc-19ab-4e71-be53-bc7413348ddb', 'Recoser tiro', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 30.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('95f5a426-58ef-46ff-8d53-2c945013ea68', 'Cambio de forro', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 30, 150.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('3ec97994-2ad6-4ce3-8b4b-fa6aa73a1a1d', 'Ajuste de costados', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('5c78d80e-becf-4a15-ba8c-13303789e9ab', 'Ajuste de mangas', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('6f416fc9-7c18-4328-9143-8b2d9dc90a72', 'Ajuste de hombro', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('325b1175-b3a5-4575-9b7e-d7535205a7d5', 'Dobladillo de ruedo', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('1038d183-66ff-47aa-989e-459b531fd5a9', 'Ajuste de manga con puño', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 30, 110.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('73a49c8f-7d05-45e9-b53c-34e58b3fa4aa', 'Cortar mangas', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 30, 90.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('d4fc4fdb-9002-4a55-8d7e-76b5dcc2eb32', 'Colocar broches', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 30, 10.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('9fa21810-5958-41f3-be5a-45efa3b4e55f', 'Ajuste de cintura', NULL, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('61b3961b-bfb2-48bb-9c2a-834179616ac0', 'Ajuste de costado', NULL, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('724fde8e-eed6-4030-9056-0cc38f4cace1', 'Dobladillo a mano sin forro', NULL, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('258c5d40-f633-4951-9ae8-c1c353af4f33', 'Dobladillo a máquina sin forro', NULL, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('ff73af15-443d-48a1-a55f-d1439b856792', 'Dobladillo con forro', NULL, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 30, 90.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('3d7fcab0-7d24-47a3-a30e-bf9e96980a66', 'Cambio de cierre', NULL, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 30, 65.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('9b2031d2-432f-4593-8722-6e579dfd798e', 'Aumentar pretina', NULL, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 30, 95.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('67e39cc8-96c4-44d9-884b-ab7997a41400', 'Ajuste de costados', NULL, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 30, 110.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('5fcb5169-133b-44fb-b3c4-551a841a7831', 'Ajuste de mangas', NULL, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 30, 75.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('4d518513-451c-4b7b-bb00-6e3bdecb2b10', 'Subir puños', NULL, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 30, 95.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('80f0b8ee-aea2-4330-aa45-8f327e2280f2', 'Ajuste de centro', NULL, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 30, 110.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('547a6161-312f-45fc-8134-ba2c1ccc2d3a', 'Ajuste de hombro', NULL, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 30, 110.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('d50d700f-4b86-4a3a-be9b-4909e7d518da', 'Cambio de forro completo', NULL, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 30, 200.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('f33379d7-e224-43b2-b9ab-2af53d19e71c', 'Ajuste de solapa', NULL, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 30, 110.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('40194d6f-cfa4-44a0-9ed6-023bd2177ae7', 'Coser cojín', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 30, 50.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('2d59b20d-f16d-4c37-9c36-8fa7f2a8f36f', 'Poner cierre a cojín', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('3442c28f-bffc-4935-9ac9-18edc706109d', 'Recoser sábanas', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 30, 60.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('8413d708-dc3f-4af7-8e71-c6ad09bbde44', 'Cambio de cierre en bolsas', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 30, 75.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('f6933288-9f29-4899-9cd6-f764386be976', 'Recoser muñeco de peluche', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 30, 40.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('50971e55-b1b9-4cd4-bd8e-ce4b843e51e6', 'Dobladillar cobijas', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 30, 80.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('b29941f2-512e-42de-9554-f6265a5e8226', 'Dobladillo de cortinas', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 30, 75.0000, true, '2026-02-16 00:31:29.171147+00', '2026-02-16 00:31:29.171147+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('bd311397-ea47-4620-8ad1-73a2a85a7810', 'Ajustar costados', 'Modificar ancho en reduccion', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 30, 120.0000, true, '2026-02-16 02:18:49.661551+00', '2026-02-16 02:18:49.661589+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('32e74c3d-f33a-41ee-b0eb-e0ad7e0cf503', 'Ajustar costados por mangas', 'Reducción de contornos corrido', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 45, 180.0000, true, '2026-02-16 02:21:04.237893+00', '2026-02-16 02:21:04.237944+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('b1eaf418-e7e5-48f6-ae8c-70507928c9f5', 'Subir puños', 'Cortar largo puños', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 20, 120.0000, true, '2026-02-16 02:22:26.759199+00', '2026-02-16 02:22:26.759224+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('5d930fd2-b85b-426a-a390-cb2b67841faa', 'Subir largo faldilla', 'Recortar largo total', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 30, 140.0000, true, '2026-02-16 02:23:42.234905+00', '2026-02-16 02:23:42.234929+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('cfe2572d-a48a-4145-8f10-2f33c524df37', 'Subir largo faldilla y puños', 'Recortar largos', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 40, 190.0000, true, '2026-02-16 02:25:49.176028+00', '2026-02-16 02:25:49.176054+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('c4827972-601d-4c38-aaf5-66180f5dcdc9', 'Ajustar costados por mangas, subir puños', 'Reducción de contornos y subir largo de mangas', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 50, 240.0000, true, '2026-02-16 02:31:30.108339+00', '2026-02-16 02:31:30.108375+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('9ff4baee-fab9-4a37-8c34-a7900144d0c5', 'Ajustar contornos por mangas, subir puños y largo faldilla', 'Reducción de contornos y subir largos', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 55, 290.0000, true, '2026-02-16 02:35:07.352866+00', '2026-02-16 02:35:07.352901+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('a3154dfa-e491-495b-94a7-e5b49d701cc4', 'Subir hombros', 'Recortar el ancho de el hombro', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 30, 130.0000, true, '2026-02-16 02:36:25.765822+00', '2026-02-16 02:36:25.765847+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('57b5ab55-e548-4d59-aec0-eb76b644c9ed', 'Subir hombros y puños', 'Recortar sobrante de hombros y puños de el largo', 'f132daa6-8ee4-4437-9fdf-13baa4b50fa6', 40, 210.0000, true, '2026-02-16 02:38:43.357818+00', '2026-02-16 02:38:43.357845+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('802d187b-e94a-4546-aad4-e189955d3107', 'Reparar safado', 'repasar costura safado', 'f24adf69-1935-41bc-b69f-4362abb267b8', 10, 50.0000, true, '2026-02-16 02:50:08.33764+00', '2026-02-16 02:50:08.337672+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('aa416cdb-56fe-4c6c-aacb-8aa2dca964d3', 'Subir largo a maquina', 'Cortar de largo', 'f24adf69-1935-41bc-b69f-4362abb267b8', 15, 75.0000, true, '2026-02-16 02:54:47.741165+00', '2026-02-16 02:54:47.741223+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('6b3e5fa6-4d91-4529-9710-efa9611d2477', 'Dobladillo a maquina forrado', 'Subir de jargo', 'eebb8410-2cd5-4040-8154-b5375a541b1b', 30, 150.0000, true, '2026-02-16 03:06:01.85098+00', '2026-02-16 03:06:01.851009+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('a0d4fd09-1750-45b6-80cd-a298dd5be4a2', 'Dobladillo a maquina', 'subir de largo', 'eebb8410-2cd5-4040-8154-b5375a541b1b', 15, 90.0000, true, '2026-02-16 03:07:29.652448+00', '2026-02-16 03:07:29.652475+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('4c1e3327-4ce6-46a9-a0de-e0d439f4c9fc', 'Subir hombros', 'Cortar sobrante de hombros', 'eebb8410-2cd5-4040-8154-b5375a541b1b', 15, 90.0000, true, '2026-02-16 03:09:14.665479+00', '2026-02-16 03:09:14.665511+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('b2e51f7e-dd2e-4970-b241-f9ff56c4385c', 'Ajustar costados', 'reducción de contornos', 'eebb8410-2cd5-4040-8154-b5375a541b1b', 20, 90.0000, true, '2026-02-16 03:13:17.225096+00', '2026-02-16 03:13:17.225134+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('e95e04d7-72e5-456a-8db7-17e2297fe844', 'Ajustar costados forrado', 'Reducción de contornos', 'eebb8410-2cd5-4040-8154-b5375a541b1b', 30, 170.0000, true, '2026-02-16 03:14:59.874499+00', '2026-02-16 03:14:59.874526+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('8c386d32-69b2-42c8-8849-8e3554a4da29', 'Reparar roto', 'Safado la costura', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 10, 40.0000, true, '2026-02-16 03:31:09.05723+00', '2026-02-16 03:31:09.057256+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('e5664c68-13e4-468d-ac63-3863ee2f6661', 'Ajustar costados', 'Reducción de contornos', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 25, 90.0000, true, '2026-02-16 03:32:33.024217+00', '2026-02-16 03:32:33.024249+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('c7437475-6989-4f49-b481-4b56659c66ed', 'Ajustar costados por mangas', 'reducción de contornos', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 140.0000, true, '2026-02-16 03:35:02.404763+00', '2026-02-16 03:35:02.404798+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('ecde93d5-af2e-4670-a384-3a129e2c0201', 'Subir puños', 'Cortar de largo', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 120.0000, true, '2026-02-16 03:36:53.760269+00', '2026-02-16 03:36:53.760335+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('eae6d537-ca75-4bff-8f25-c38ca5e086c6', 'Subir puños por cierre', 'Cortar sobrante', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 35, 170.0000, true, '2026-02-16 03:38:46.782347+00', '2026-02-16 03:38:46.782376+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('b06dd0c0-c462-4eec-9f8e-acfb3a343d58', 'Subir hombros', 'Cortar tela de hombro sobrante', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 130.0000, true, '2026-02-16 03:41:10.55759+00', '2026-02-16 03:41:10.557617+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('db59f6d3-6981-4d21-aeeb-f417f5c2e4b0', 'Subir hombros y puños', 'Cortar sobrante', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 170.0000, true, '2026-02-16 03:43:05.839335+00', '2026-02-16 03:43:05.839364+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('234bc17e-4ff4-4572-b863-9094c6635075', 'Colocar resorte en puños', '100', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 100.0000, true, '2026-02-16 03:44:33.89019+00', '2026-02-16 03:44:33.890222+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('294b36c0-cfb6-4275-9fed-6b439c6bda56', 'Colocar resorte en faldilla', 'Cambiar elastico', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 350, 120.0000, false, '2026-02-16 03:47:57.258436+00', '2026-02-16 03:48:23.925121+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('88865e7f-7cba-40b8-93b6-630a11f1b5f9', 'Colocar resorte', 'Cambiar resorte', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 35, 120.0000, true, '2026-02-16 03:49:52.544376+00', '2026-02-16 03:49:52.544407+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('94656560-9260-4947-95cd-91964dc9dd3d', 'Canbiar cierre', 'Colocar resorte nuevo', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 120.0000, false, '2026-02-16 03:51:20.834085+00', '2026-02-16 03:51:57.625316+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('057179a9-f22f-43bd-8a5c-a136c1072c4d', 'Cambiar cierre', 'Colocar cierre nuevo', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 110.0000, true, '2026-02-16 03:53:05.300041+00', '2026-02-16 03:53:05.300076+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('456ed520-68d5-4739-a46f-76ba4a68b13a', 'Subir largo faldilla', 'Cortar largo', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 20, 100.0000, true, '2026-02-16 03:54:36.892145+00', '2026-02-16 03:54:36.892173+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('2a873d36-80e8-4432-9367-e4b1ba3aa19a', 'Subir largo faldilla por cierre', 'Cortar sobrante', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 35, 175.0000, true, '2026-02-16 03:55:58.203576+00', '2026-02-16 03:55:58.203599+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('045b5e98-fcf0-454a-8c65-03544afffff0', 'Subir hombros, largo mangas y faldilla', 'Cortar sobrante', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 50, 220.0000, true, '2026-02-16 03:59:12.740959+00', '2026-02-16 03:59:12.740989+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('dd9f6f7e-14e4-420c-8ef9-e085e8a7bec2', 'Subir puños y largo faldilla por cierre', 'Cortar sobrante', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 55, 230.0000, true, '2026-02-16 04:01:10.621243+00', '2026-02-16 04:01:10.621273+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('d045237d-f319-4b0f-b193-2d3b98edbf57', 'Cambiar cuello', 'nuevo', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 130.0000, true, '2026-02-16 04:03:11.477038+00', '2026-02-16 04:03:11.477077+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('39405f5f-056f-4f98-8d65-8746e517cab8', 'Voltear cuello', 'Desarmar y colocar', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 15, 70.0000, true, '2026-02-16 04:04:53.604195+00', '2026-02-16 04:04:53.604241+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('b0751908-075c-467e-956b-c4d2be16d1b9', 'Cambiar cierresde bolsa', 'Colocar nuevo', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 90.0000, true, '2026-02-16 04:07:47.425439+00', '2026-02-16 04:07:47.425467+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('f14b326d-2bee-4651-a359-7eb269de560d', 'Cambiar cierres', 'Nuevos', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 135.0000, false, '2026-02-16 04:08:51.126074+00', '2026-02-16 04:09:11.907567+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('9686493a-13cf-4dcb-bd6e-05ef56af6343', 'Cambiar cierres', 'Nuevos', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 35, 145.0000, true, '2026-02-16 04:10:04.456731+00', '2026-02-16 04:10:04.45676+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('1dbaf02a-10ee-4020-affd-64c53ef194cc', 'Colocar bolsas de parche', 'Nuevas', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 120.0000, true, '2026-02-16 04:11:43.497724+00', '2026-02-16 04:11:43.497749+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('6adef6fa-0138-4214-85cb-436ecf7ef0d6', 'Colocar bolsas de vivo', 'nuevas', '9e2d6930-88d3-4628-a466-4897bbd1dd17', 30, 190.0000, true, '2026-02-16 04:12:21.644528+00', '2026-02-16 04:12:21.644566+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.cci_service (id_service, name, description, id_garment_type, default_duration_min, base_price, is_active, created_at, updated_at, deleted_at, is_deleted) VALUES ('4ffa223e-460b-47c0-84d0-9f6ebdef5b85', 'ColocR PRESILLA', 'Confeccionar', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 20, 20.0000, true, '2026-02-16 04:18:54.230569+00', '2026-02-16 04:18:54.230593+00', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('db063da0-d4bd-4e46-9d0a-19be7921da77', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '255705ed-9fd8-4dea-8137-05ebecca31a8', 85.0000, '2026-02-16 01:44:22.815778+00', '2026-02-16 01:44:22.815811+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('afe5ed6e-6f9c-4b59-958f-f1f77df85c64', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2c79444d-ec01-4b58-9c4b-fb1f991be2b3', 80.0000, '2026-02-16 01:44:22.820013+00', '2026-02-16 01:44:22.820039+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('4fa8f66e-972a-4187-9c87-6030a971dd08', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'e4279d84-5600-4342-a1f7-f785b6a0fc0e', 80.0000, '2026-02-16 01:44:22.821991+00', '2026-02-16 01:44:22.822017+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('09622689-0cf4-42bf-a95d-773e8c6923ff', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '9cf991c7-0fb6-44e7-92cb-70a9a87f3e34', 85.0000, '2026-02-16 01:44:22.824565+00', '2026-02-16 01:44:22.824593+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('44b74d96-934f-4c9d-a243-e208cf3a4caf', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '403c51d8-8c57-4f8b-b678-48cdc47018e7', 80.0000, '2026-02-16 01:44:22.826124+00', '2026-02-16 01:44:22.826145+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('43ab4590-e799-4715-9d74-42b239c3ebc9', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '20e6aaea-4f11-48d7-9bb1-4feb10d55401', 80.0000, '2026-02-16 01:44:22.827753+00', '2026-02-16 01:44:22.827787+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('905781d1-07b2-4997-8df4-5ed2153f79aa', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '713fdee8-ee9d-4cef-af0b-cde5e3bdb577', 85.0000, '2026-02-16 01:44:22.8296+00', '2026-02-16 01:44:22.829624+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('f4d6fc8d-cfcf-4608-b910-df4309bdba2d', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'cc5ee366-deda-4617-8cf5-7e50516ffbe7', 115.0000, '2026-02-16 01:44:22.830909+00', '2026-02-16 01:44:22.830929+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('632ed1c2-3de5-4df7-82d9-8a9ab7a0bf41', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'd86c0b05-f655-4d1b-aad7-a9b178b61c2b', 115.0000, '2026-02-16 01:44:22.832304+00', '2026-02-16 01:44:22.832324+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('4baca4c6-4941-48c4-b33d-ee56314f4b19', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'facfca1d-0e66-450e-87db-e51aae877d23', 140.0000, '2026-02-16 01:44:22.833719+00', '2026-02-16 01:44:22.833738+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('6489fda6-5138-4f5b-9f50-8aacda72e798', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'eb59342d-3d87-4303-a305-edf13c639a7c', 65.0000, '2026-02-16 01:44:22.834977+00', '2026-02-16 01:44:22.834997+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('151d6466-4606-490b-a648-d7c435ebf0e4', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'dd6f3064-bbf8-4465-8124-15e4b7fb9ce8', 75.0000, '2026-02-16 01:44:22.836348+00', '2026-02-16 01:44:22.836366+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('c72f6900-7a56-4216-95c1-0903f1e59472', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b013ab81-0f45-43f2-a376-e8659f4ed4d9', 130.0000, '2026-02-16 01:44:22.837443+00', '2026-02-16 01:44:22.83746+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('deefd96c-25e1-4933-939f-d1deed955c4a', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '21e0f3e6-84cd-461e-8d32-72b94a09ebf6', 95.0000, '2026-02-16 01:44:22.838592+00', '2026-02-16 01:44:22.838609+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('729feb9e-b3d6-4b98-8426-d9d452b38b32', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '4cbe4f4a-fab7-4980-a351-a2cbbe650e15', 240.0000, '2026-02-16 01:44:22.839701+00', '2026-02-16 01:44:22.839717+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('8377bd71-d6fb-43a0-a419-3a9de079e357', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'fdbd8fdc-19ab-4e71-be53-bc7413348ddb', 50.0000, '2026-02-16 01:44:22.840737+00', '2026-02-16 01:44:22.840753+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('99669bfb-301d-4224-a0f4-9ed30b9d58bd', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '95f5a426-58ef-46ff-8d53-2c945013ea68', 170.0000, '2026-02-16 01:44:22.842304+00', '2026-02-16 01:44:22.842322+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('6315c34c-74c2-402d-88ef-16b34e17f27c', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '3ec97994-2ad6-4ce3-8b4b-fa6aa73a1a1d', 85.0000, '2026-02-16 01:44:22.84349+00', '2026-02-16 01:44:22.843509+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('73f884ee-c1ef-4ac3-9969-f5855f08cbce', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '5c78d80e-becf-4a15-ba8c-13303789e9ab', 80.0000, '2026-02-16 01:44:22.844548+00', '2026-02-16 01:44:22.844562+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('78f2f804-4bb9-4157-9524-9f25409363d3', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '6f416fc9-7c18-4328-9143-8b2d9dc90a72', 85.0000, '2026-02-16 01:44:22.845721+00', '2026-02-16 01:44:22.845739+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('217b1575-f700-483c-9b43-d7a84c9133de', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '325b1175-b3a5-4575-9b7e-d7535205a7d5', 80.0000, '2026-02-16 01:44:22.846918+00', '2026-02-16 01:44:22.846946+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('ee6b419d-ca0c-4ced-8815-aa297b51fee7', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '1038d183-66ff-47aa-989e-459b531fd5a9', 130.0000, '2026-02-16 01:44:22.848199+00', '2026-02-16 01:44:22.848217+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('933d6bf4-e296-4aaf-b4a1-58efb446361d', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '73a49c8f-7d05-45e9-b53c-34e58b3fa4aa', 110.0000, '2026-02-16 01:44:22.849451+00', '2026-02-16 01:44:22.849487+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('306a5303-d37d-43e5-b93d-2f98b00e0923', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'd4fc4fdb-9002-4a55-8d7e-76b5dcc2eb32', 30.0000, '2026-02-16 01:44:22.850545+00', '2026-02-16 01:44:22.850558+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('ece0d6f4-37a1-4a20-aecb-b7b946cd71e8', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '9fa21810-5958-41f3-be5a-45efa3b4e55f', 85.0000, '2026-02-16 01:44:22.851541+00', '2026-02-16 01:44:22.851553+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('7eac364b-78fb-40d5-8ce0-b0bd8f7a6c25', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '61b3961b-bfb2-48bb-9c2a-834179616ac0', 85.0000, '2026-02-16 01:44:22.852714+00', '2026-02-16 01:44:22.852731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('1fbdf9c9-3eee-4915-b29a-ddc0ffa09304', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '724fde8e-eed6-4030-9056-0cc38f4cace1', 85.0000, '2026-02-16 01:44:22.854732+00', '2026-02-16 01:44:22.854761+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('03f992d7-539c-4ff7-be4d-1f823b1e1a53', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '258c5d40-f633-4951-9ae8-c1c353af4f33', 80.0000, '2026-02-16 01:44:22.855981+00', '2026-02-16 01:44:22.856+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('ecdd4b9b-a698-489d-addd-647694a1b99c', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'ff73af15-443d-48a1-a55f-d1439b856792', 110.0000, '2026-02-16 01:44:22.857246+00', '2026-02-16 01:44:22.857263+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('03db768c-6073-44d9-8990-57e2f3dbdd18', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '3d7fcab0-7d24-47a3-a30e-bf9e96980a66', 85.0000, '2026-02-16 01:44:22.858931+00', '2026-02-16 01:44:22.858948+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('8cd941f2-4014-4e44-8f33-a8243ef2d0eb', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '9b2031d2-432f-4593-8722-6e579dfd798e', 115.0000, '2026-02-16 01:44:22.859918+00', '2026-02-16 01:44:22.859932+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('45217fcb-b8b7-4b37-b518-426771bd1948', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '67e39cc8-96c4-44d9-884b-ab7997a41400', 130.0000, '2026-02-16 01:44:22.86167+00', '2026-02-16 01:44:22.861985+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('c3a3389b-1dc1-409d-92b7-b91479c07c1f', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '5fcb5169-133b-44fb-b3c4-551a841a7831', 95.0000, '2026-02-16 01:44:22.86371+00', '2026-02-16 01:44:22.863729+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('980bc64c-3378-40fa-a5dc-d42c77abd7ae', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '4d518513-451c-4b7b-bb00-6e3bdecb2b10', 115.0000, '2026-02-16 01:44:22.864725+00', '2026-02-16 01:44:22.864739+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('ceb04510-e534-4e93-bb3c-c408e8ac538c', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '80f0b8ee-aea2-4330-aa45-8f327e2280f2', 130.0000, '2026-02-16 01:44:22.865982+00', '2026-02-16 01:44:22.865995+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('43f6cff9-a6cb-44df-b674-638946589d60', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '547a6161-312f-45fc-8134-ba2c1ccc2d3a', 130.0000, '2026-02-16 01:44:22.867068+00', '2026-02-16 01:44:22.867082+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('41d21fc0-8023-4b6a-890c-8e7b3c87063a', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'd50d700f-4b86-4a3a-be9b-4909e7d518da', 220.0000, '2026-02-16 01:44:22.868864+00', '2026-02-16 01:44:22.868878+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('ef471adc-551d-4625-953a-2490f2b4b6a0', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'f33379d7-e224-43b2-b9ab-2af53d19e71c', 130.0000, '2026-02-16 01:44:22.870183+00', '2026-02-16 01:44:22.870198+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('b191274a-97bd-4685-b0b4-be8b20580f28', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '40194d6f-cfa4-44a0-9ed6-023bd2177ae7', 70.0000, '2026-02-16 01:44:22.871439+00', '2026-02-16 01:44:22.871455+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('86bc5b78-b273-4988-880f-510f7f398a33', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2d59b20d-f16d-4c37-9c36-8fa7f2a8f36f', 80.0000, '2026-02-16 01:44:22.872688+00', '2026-02-16 01:44:22.8727+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('45b0974c-7fba-4e93-a09d-e2991e68de1e', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '3442c28f-bffc-4935-9ac9-18edc706109d', 80.0000, '2026-02-16 01:44:22.873841+00', '2026-02-16 01:44:22.873856+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('ad029828-d228-43f4-b185-24640b15b5c6', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '8413d708-dc3f-4af7-8e71-c6ad09bbde44', 95.0000, '2026-02-16 01:44:22.875532+00', '2026-02-16 01:44:22.875546+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('6093643b-be35-42ab-ae3d-9c7fdd6371a9', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'f6933288-9f29-4899-9cd6-f764386be976', 60.0000, '2026-02-16 01:44:22.876514+00', '2026-02-16 01:44:22.876529+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('00239ce9-1655-4b2f-94ec-794080d0f953', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '50971e55-b1b9-4cd4-bd8e-ce4b843e51e6', 100.0000, '2026-02-16 01:44:22.87821+00', '2026-02-16 01:44:22.878225+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('06d2ff07-b311-420d-ac37-ccb6c495ed6e', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b29941f2-512e-42de-9554-f6265a5e8226', 95.0000, '2026-02-16 01:44:22.879997+00', '2026-02-16 01:44:22.880015+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('0f70c886-8e46-4817-ab2c-512645586902', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '7bc6e102-6c45-47d7-8eb5-891d6822b4d2', 95.0000, '2026-02-16 01:44:22.88157+00', '2026-02-16 01:44:22.881585+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('8b7704fe-8d7f-4ce3-a121-06f6823aac3a', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'ff892daf-f5bb-40b4-89a8-c00799a91a90', 105.0000, '2026-02-16 01:44:22.882764+00', '2026-02-16 01:44:22.882777+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tcc_price_list_item (id_price_list_item, id_price_list, id_service, price, created_at, updated_at) VALUES ('407a16ae-e068-43ae-9a2c-2cdabbdcfdab', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'f4613e65-02d8-4df5-8f69-c1cf759699f4', 95.0000, '2026-02-16 01:44:22.883695+00', '2026-02-16 01:44:22.883706+00') ON CONFLICT DO NOTHING;