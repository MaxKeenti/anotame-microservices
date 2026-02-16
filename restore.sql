--
-- NOTE:
--
-- File paths need to be edited. Search for $$PATH$$ and
-- replace it with the path to the directory containing
-- the extracted data files.
--
--
-- PostgreSQL database dump
--

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS anotame;
--
-- Name: anotame; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE anotame WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE anotame OWNER TO admin;

\unrestrict (null)
\connect anotame
\restrict (null)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cca_role; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cca_role (
    id_role uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.cca_role OWNER TO admin;

--
-- Name: cci_garment_type; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cci_garment_type (
    id_garment_type uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.cci_garment_type OWNER TO admin;

--
-- Name: cci_service; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cci_service (
    id_service uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    id_garment_type uuid,
    default_duration_min integer DEFAULT 30,
    base_price numeric(19,4) DEFAULT 0.0,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.cci_service OWNER TO admin;

--
-- Name: tca_user; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tca_user (
    id_user uuid DEFAULT gen_random_uuid() NOT NULL,
    id_role uuid NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255),
    password_hash character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    last_login_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tca_user OWNER TO admin;

--
-- Name: tcc_price_list; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tcc_price_list (
    id_price_list uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.tcc_price_list OWNER TO admin;

--
-- Name: tcc_price_list_item; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tcc_price_list_item (
    id_price_list_item uuid DEFAULT gen_random_uuid() NOT NULL,
    id_price_list uuid NOT NULL,
    id_service uuid NOT NULL,
    price numeric(19,4) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tcc_price_list_item OWNER TO admin;

--
-- Name: tce_branch; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tce_branch (
    id_branch uuid DEFAULT gen_random_uuid() NOT NULL,
    id_establishment uuid NOT NULL,
    name character varying(150) NOT NULL,
    latitude double precision,
    longitude double precision,
    timezone character varying(50) DEFAULT 'America/Mexico_City'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.tce_branch OWNER TO admin;

--
-- Name: tce_employee_assignment; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tce_employee_assignment (
    id_assignment uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid NOT NULL,
    id_branch uuid NOT NULL,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tce_employee_assignment OWNER TO admin;

--
-- Name: tce_establishment; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tce_establishment (
    id_establishment uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    tax_info jsonb,
    owner_name character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.tce_establishment OWNER TO admin;

--
-- Name: tco_customer; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tco_customer (
    id_customer uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255),
    phone_number character varying(255),
    email character varying(255),
    preferences jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tco_customer OWNER TO admin;

--
-- Name: tco_order; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tco_order (
    id_order uuid DEFAULT gen_random_uuid() NOT NULL,
    folio_branch integer NOT NULL,
    id_branch uuid NOT NULL,
    id_customer uuid NOT NULL,
    created_by_user_id uuid NOT NULL,
    customer_snapshot jsonb,
    total_amount numeric(19,4) DEFAULT 0.0 NOT NULL,
    currency character varying(3) DEFAULT 'MXN'::character varying,
    amount_paid numeric(19,4) DEFAULT 0.0,
    payment_method character varying(255),
    current_status character varying(50) DEFAULT 'RECEIVED'::character varying,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    promised_at timestamp with time zone,
    delivered_at timestamp with time zone,
    committed_deadline timestamp with time zone,
    notes character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    status character varying(255) NOT NULL,
    ticket_number character varying(255)
);


ALTER TABLE public.tco_order OWNER TO admin;

--
-- Name: tco_order_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tco_order_history (
    id_history uuid DEFAULT gen_random_uuid() NOT NULL,
    id_order uuid NOT NULL,
    previous_status character varying(50),
    new_status character varying(50) NOT NULL,
    changed_by_user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tco_order_history OWNER TO admin;

--
-- Name: tco_order_item; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tco_order_item (
    id_order_item uuid DEFAULT gen_random_uuid() NOT NULL,
    id_order uuid NOT NULL,
    id_garment_type uuid NOT NULL,
    id_service uuid NOT NULL,
    service_name character varying(255),
    garment_name character varying(255),
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(19,4) NOT NULL,
    subtotal numeric(19,4) NOT NULL,
    adjustment_amount numeric(19,4) DEFAULT 0.0,
    adjustment_reason character varying(255),
    notes character varying(255),
    item_status character varying(50) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tco_order_item OWNER TO admin;

--
-- Name: tco_work_order; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tco_work_order (
    id_work_order uuid NOT NULL,
    created_at timestamp(6) without time zone,
    id_order uuid NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);


ALTER TABLE public.tco_work_order OWNER TO admin;

--
-- Name: tco_work_order_item; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tco_work_order_item (
    id_work_order_item uuid NOT NULL,
    current_stage character varying(255) NOT NULL,
    notes character varying(255),
    id_sales_order_item uuid NOT NULL,
    service_name character varying(255) NOT NULL,
    id_work_order uuid NOT NULL
);


ALTER TABLE public.tco_work_order_item OWNER TO admin;

--
-- Name: top_holiday; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.top_holiday (
    id_holiday uuid DEFAULT gen_random_uuid() NOT NULL,
    holiday_date date NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.top_holiday OWNER TO admin;

--
-- Name: top_shift; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.top_shift (
    id_shift uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT top_shift_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7)))
);


ALTER TABLE public.top_shift OWNER TO admin;

--
-- Name: top_work_day; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.top_work_day (
    id_work_day uuid DEFAULT gen_random_uuid() NOT NULL,
    day_of_week integer NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    open_time time without time zone DEFAULT '09:00:00'::time without time zone,
    close_time time without time zone DEFAULT '18:00:00'::time without time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT top_work_day_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7)))
);


ALTER TABLE public.top_work_day OWNER TO admin;

--
-- Data for Name: cca_role; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3748.dat

--
-- Data for Name: cci_garment_type; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3749.dat

--
-- Data for Name: cci_service; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3750.dat

--
-- Data for Name: tca_user; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3753.dat

--
-- Data for Name: tcc_price_list; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3751.dat

--
-- Data for Name: tcc_price_list_item; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3752.dat

--
-- Data for Name: tce_branch; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3755.dat

--
-- Data for Name: tce_employee_assignment; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3756.dat

--
-- Data for Name: tce_establishment; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3754.dat

--
-- Data for Name: tco_customer; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3760.dat

--
-- Data for Name: tco_order; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3761.dat

--
-- Data for Name: tco_order_history; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3762.dat

--
-- Data for Name: tco_order_item; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3763.dat

--
-- Data for Name: tco_work_order; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3764.dat

--
-- Data for Name: tco_work_order_item; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3765.dat

--
-- Data for Name: top_holiday; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3758.dat

--
-- Data for Name: top_shift; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3759.dat

--
-- Data for Name: top_work_day; Type: TABLE DATA; Schema: public; Owner: admin
--

\i $$PATH$$/3757.dat

--
-- Name: cca_role cca_role_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cca_role
    ADD CONSTRAINT cca_role_code_key UNIQUE (code);


--
-- Name: cca_role cca_role_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cca_role
    ADD CONSTRAINT cca_role_pkey PRIMARY KEY (id_role);


--
-- Name: cci_garment_type cci_garment_type_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cci_garment_type
    ADD CONSTRAINT cci_garment_type_pkey PRIMARY KEY (id_garment_type);


--
-- Name: cci_service cci_service_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cci_service
    ADD CONSTRAINT cci_service_pkey PRIMARY KEY (id_service);


--
-- Name: tca_user tca_user_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tca_user
    ADD CONSTRAINT tca_user_email_key UNIQUE (email);


--
-- Name: tca_user tca_user_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tca_user
    ADD CONSTRAINT tca_user_pkey PRIMARY KEY (id_user);


--
-- Name: tca_user tca_user_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tca_user
    ADD CONSTRAINT tca_user_username_key UNIQUE (username);


--
-- Name: tcc_price_list_item tcc_price_list_item_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tcc_price_list_item
    ADD CONSTRAINT tcc_price_list_item_pkey PRIMARY KEY (id_price_list_item);


--
-- Name: tcc_price_list tcc_price_list_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tcc_price_list
    ADD CONSTRAINT tcc_price_list_pkey PRIMARY KEY (id_price_list);


--
-- Name: tce_branch tce_branch_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tce_branch
    ADD CONSTRAINT tce_branch_pkey PRIMARY KEY (id_branch);


--
-- Name: tce_employee_assignment tce_employee_assignment_id_user_id_branch_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tce_employee_assignment
    ADD CONSTRAINT tce_employee_assignment_id_user_id_branch_key UNIQUE (id_user, id_branch);


--
-- Name: tce_employee_assignment tce_employee_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tce_employee_assignment
    ADD CONSTRAINT tce_employee_assignment_pkey PRIMARY KEY (id_assignment);


--
-- Name: tce_establishment tce_establishment_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tce_establishment
    ADD CONSTRAINT tce_establishment_pkey PRIMARY KEY (id_establishment);


--
-- Name: tco_customer tco_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_customer
    ADD CONSTRAINT tco_customer_pkey PRIMARY KEY (id_customer);


--
-- Name: tco_order_history tco_order_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order_history
    ADD CONSTRAINT tco_order_history_pkey PRIMARY KEY (id_history);


--
-- Name: tco_order_item tco_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order_item
    ADD CONSTRAINT tco_order_item_pkey PRIMARY KEY (id_order_item);


--
-- Name: tco_order tco_order_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order
    ADD CONSTRAINT tco_order_pkey PRIMARY KEY (id_order);


--
-- Name: tco_work_order_item tco_work_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_work_order_item
    ADD CONSTRAINT tco_work_order_item_pkey PRIMARY KEY (id_work_order_item);


--
-- Name: tco_work_order tco_work_order_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_work_order
    ADD CONSTRAINT tco_work_order_pkey PRIMARY KEY (id_work_order);


--
-- Name: top_holiday top_holiday_holiday_date_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.top_holiday
    ADD CONSTRAINT top_holiday_holiday_date_key UNIQUE (holiday_date);


--
-- Name: top_holiday top_holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.top_holiday
    ADD CONSTRAINT top_holiday_pkey PRIMARY KEY (id_holiday);


--
-- Name: top_shift top_shift_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.top_shift
    ADD CONSTRAINT top_shift_pkey PRIMARY KEY (id_shift);


--
-- Name: top_work_day top_work_day_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.top_work_day
    ADD CONSTRAINT top_work_day_day_of_week_key UNIQUE (day_of_week);


--
-- Name: top_work_day top_work_day_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.top_work_day
    ADD CONSTRAINT top_work_day_pkey PRIMARY KEY (id_work_day);


--
-- Name: tco_order ukle4wg8yp97klynuc5djx6ytyw; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order
    ADD CONSTRAINT ukle4wg8yp97klynuc5djx6ytyw UNIQUE (ticket_number);


--
-- Name: idx_order_customer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_customer ON public.tco_order USING btree (id_customer);


--
-- Name: idx_order_history_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_history_order ON public.tco_order_history USING btree (id_order);


--
-- Name: idx_order_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_status ON public.tco_order USING btree (current_status);


--
-- Name: cci_service cci_service_id_garment_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cci_service
    ADD CONSTRAINT cci_service_id_garment_type_fkey FOREIGN KEY (id_garment_type) REFERENCES public.cci_garment_type(id_garment_type);


--
-- Name: tco_work_order_item fk9guut1ul1vrp5kqlv7o3jqova; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_work_order_item
    ADD CONSTRAINT fk9guut1ul1vrp5kqlv7o3jqova FOREIGN KEY (id_work_order) REFERENCES public.tco_work_order(id_work_order);


--
-- Name: tca_user tca_user_id_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tca_user
    ADD CONSTRAINT tca_user_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.cca_role(id_role);


--
-- Name: tcc_price_list_item tcc_price_list_item_id_price_list_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tcc_price_list_item
    ADD CONSTRAINT tcc_price_list_item_id_price_list_fkey FOREIGN KEY (id_price_list) REFERENCES public.tcc_price_list(id_price_list);


--
-- Name: tcc_price_list_item tcc_price_list_item_id_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tcc_price_list_item
    ADD CONSTRAINT tcc_price_list_item_id_service_fkey FOREIGN KEY (id_service) REFERENCES public.cci_service(id_service);


--
-- Name: tce_branch tce_branch_id_establishment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tce_branch
    ADD CONSTRAINT tce_branch_id_establishment_fkey FOREIGN KEY (id_establishment) REFERENCES public.tce_establishment(id_establishment);


--
-- Name: tce_employee_assignment tce_employee_assignment_id_branch_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tce_employee_assignment
    ADD CONSTRAINT tce_employee_assignment_id_branch_fkey FOREIGN KEY (id_branch) REFERENCES public.tce_branch(id_branch);


--
-- Name: tce_employee_assignment tce_employee_assignment_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tce_employee_assignment
    ADD CONSTRAINT tce_employee_assignment_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tca_user(id_user);


--
-- Name: tco_order_history tco_order_history_id_order_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order_history
    ADD CONSTRAINT tco_order_history_id_order_fkey FOREIGN KEY (id_order) REFERENCES public.tco_order(id_order) ON DELETE CASCADE;


--
-- Name: tco_order tco_order_id_branch_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order
    ADD CONSTRAINT tco_order_id_branch_fkey FOREIGN KEY (id_branch) REFERENCES public.tce_branch(id_branch);


--
-- Name: tco_order tco_order_id_customer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order
    ADD CONSTRAINT tco_order_id_customer_fkey FOREIGN KEY (id_customer) REFERENCES public.tco_customer(id_customer);


--
-- Name: tco_order_item tco_order_item_id_garment_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order_item
    ADD CONSTRAINT tco_order_item_id_garment_type_fkey FOREIGN KEY (id_garment_type) REFERENCES public.cci_garment_type(id_garment_type);


--
-- Name: tco_order_item tco_order_item_id_order_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order_item
    ADD CONSTRAINT tco_order_item_id_order_fkey FOREIGN KEY (id_order) REFERENCES public.tco_order(id_order) ON DELETE CASCADE;


--
-- Name: tco_order_item tco_order_item_id_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tco_order_item
    ADD CONSTRAINT tco_order_item_id_service_fkey FOREIGN KEY (id_service) REFERENCES public.cci_service(id_service);


--
-- Name: top_shift top_shift_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.top_shift
    ADD CONSTRAINT top_shift_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tca_user(id_user);


--
-- PostgreSQL database dump complete
--

