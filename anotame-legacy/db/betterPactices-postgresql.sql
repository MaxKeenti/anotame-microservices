--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1 (Homebrew)
-- Dumped by pg_dump version 18.1 (Homebrew)

-- Started on 2025-12-10 15:21:39 CST


--
-- TOC entry 2 (class 3079 OID 17539)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 4927 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--





--
-- TOC entry 225 (class 1259 OID 18621)
-- Name: cca01_genero; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.cca01_genero (
    id_genero integer NOT NULL,
    tx_nombre character varying(50) NOT NULL,
    tx_descripcion character varying(255) NOT NULL,
    st_activo boolean NOT NULL
);



--
-- TOC entry 226 (class 1259 OID 18630)
-- Name: cca02_rol; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.cca02_rol (
    id_rol integer NOT NULL,
    tx_nombre character varying(50) NOT NULL,
    tx_descripcion character varying(255) NOT NULL,
    st_activo boolean NOT NULL
);



--
-- TOC entry 227 (class 1259 OID 18639)
-- Name: cci01_servicio; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--


CREATE TABLE public.cci01_servicio (
    id_servicio integer NOT NULL,
    tx_nombre character varying(50) NOT NULL,
    tx_descripcion character varying(255) NOT NULL,
    st_activo boolean NOT NULL,
    nu_duracion integer NOT NULL
);

CREATE SEQUENCE public.cci01_servicio_id_servicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cci01_servicio_id_servicio_seq OWNED BY public.cci01_servicio.id_servicio;




--
-- TOC entry 229 (class 1259 OID 18650)
-- Name: tca01_persona; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tca01_persona (
    id_persona integer NOT NULL,
    fk_id_genero integer NOT NULL,
    tx_nombre character varying(100) NOT NULL,
    tx_primer_apellido character varying(100) NOT NULL,
    tx_segundo_apellido character varying(100),
    fh_nacimiento date NOT NULL
);



--
-- TOC entry 228 (class 1259 OID 18649)
-- Name: tca01_persona_id_persona_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tca01_persona_id_persona_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4928 (class 0 OID 0)
-- Dependencies: 228
-- Name: tca01_persona_id_persona_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tca01_persona_id_persona_seq OWNED BY public.tca01_persona.id_persona;


--
-- TOC entry 230 (class 1259 OID 18661)
-- Name: tca02_usuario; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tca02_usuario (
    id_usuario integer NOT NULL,
    fk_id_rol integer NOT NULL,
    tx_login character varying(100) NOT NULL,
    tx_password character varying(255) NOT NULL,
    st_activo boolean NOT NULL
);



--
-- TOC entry 232 (class 1259 OID 18672)
-- Name: tce01_establecimiento; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce01_establecimiento (
    id_establecimiento integer NOT NULL,
    tx_nombre character varying(100) NOT NULL
);



--
-- TOC entry 231 (class 1259 OID 18671)
-- Name: tce01_establecimiento_id_establecimiento_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tce01_establecimiento_id_establecimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4929 (class 0 OID 0)
-- Dependencies: 231
-- Name: tce01_establecimiento_id_establecimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tce01_establecimiento_id_establecimiento_seq OWNED BY public.tce01_establecimiento.id_establecimiento;


--
-- TOC entry 234 (class 1259 OID 18681)
-- Name: tce02_sucursal; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce02_sucursal (
    id_sucursal integer NOT NULL,
    fk_id_establecimiento integer NOT NULL,
    tx_nombre character varying(100) NOT NULL,
    gm_ubicacion public.geometry NOT NULL
);



--
-- TOC entry 233 (class 1259 OID 18680)
-- Name: tce02_sucursal_id_sucursal_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tce02_sucursal_id_sucursal_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4930 (class 0 OID 0)
-- Dependencies: 233
-- Name: tce02_sucursal_id_sucursal_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tce02_sucursal_id_sucursal_seq OWNED BY public.tce02_sucursal.id_sucursal;


--
-- TOC entry 235 (class 1259 OID 18693)
-- Name: tce03_empleado; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce03_empleado (
    id_empleado integer NOT NULL,
    fk_id_sucursal integer NOT NULL
);



--
-- TOC entry 237 (class 1259 OID 18701)
-- Name: tce04_dia_laboral; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce04_dia_laboral (
    id_dia integer NOT NULL,
    tx_nombre character varying(50) NOT NULL,
    tx_descripcion character varying(255) NOT NULL,
    st_activo integer NOT NULL
);



--
-- TOC entry 236 (class 1259 OID 18700)
-- Name: tce04_dia_laboral_id_dia_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tce04_dia_laboral_id_dia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4931 (class 0 OID 0)
-- Dependencies: 236
-- Name: tce04_dia_laboral_id_dia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tce04_dia_laboral_id_dia_seq OWNED BY public.tce04_dia_laboral.id_dia;


--
-- TOC entry 239 (class 1259 OID 18712)
-- Name: tce05_dia_descanso; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce05_dia_descanso (
    id_dia_descanso integer NOT NULL,
    fk_id_empleado integer NOT NULL,
    fh_descanso date NOT NULL
);



--
-- TOC entry 238 (class 1259 OID 18711)
-- Name: tce05_dia_descanso_id_dia_descanso_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tce05_dia_descanso_id_dia_descanso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4932 (class 0 OID 0)
-- Dependencies: 238
-- Name: tce05_dia_descanso_id_dia_descanso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tce05_dia_descanso_id_dia_descanso_seq OWNED BY public.tce05_dia_descanso.id_dia_descanso;


--
-- TOC entry 240 (class 1259 OID 18721)
-- Name: tce06_empleado_horario; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce06_empleado_horario (
    fk_id_horario integer NOT NULL,
    fk_id_persona integer NOT NULL
);



--
-- TOC entry 241 (class 1259 OID 18728)
-- Name: tce07_bloque_cita; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce07_bloque_cita (
    fk_id_sucursal integer NOT NULL,
    fk_id_cita integer,
    fh_inicio timestamp without time zone NOT NULL,
    fh_fin timestamp without time zone NOT NULL
);



--
-- TOC entry 243 (class 1259 OID 18735)
-- Name: tce08_horario; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tce08_horario (
    id_horario integer NOT NULL,
    fk_id_sucursal integer NOT NULL,
    fk_id_dia integer NOT NULL,
    tm_inicio time without time zone NOT NULL,
    tm_fin time without time zone NOT NULL
);



--
-- TOC entry 242 (class 1259 OID 18734)
-- Name: tce08_horario_id_horario_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tce08_horario_id_horario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4933 (class 0 OID 0)
-- Dependencies: 242
-- Name: tce08_horario_id_horario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tce08_horario_id_horario_seq OWNED BY public.tce08_horario.id_horario;


--
-- TOC entry 245 (class 1259 OID 18747)
-- Name: tci01_estado_lista_precio; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tci01_estado_lista_precio (
    id_estado integer NOT NULL,
    tx_nombre character varying(50) NOT NULL
);



--
-- TOC entry 244 (class 1259 OID 18746)
-- Name: tci01_estado_lista_precio_id_estado_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tci01_estado_lista_precio_id_estado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4934 (class 0 OID 0)
-- Dependencies: 244
-- Name: tci01_estado_lista_precio_id_estado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tci01_estado_lista_precio_id_estado_seq OWNED BY public.tci01_estado_lista_precio.id_estado;


--
-- TOC entry 246 (class 1259 OID 18755)
-- Name: tci02_servicio_lista_precio; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tci02_servicio_lista_precio (
    id_servicio_lista_precio integer NOT NULL,
    fk_id_servicio integer NOT NULL,
    fk_id_lista_precio integer NOT NULL,
    nu_precio integer NOT NULL
);



--
-- TOC entry 248 (class 1259 OID 18764)
-- Name: tci03_lista_precio; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tci03_lista_precio (
    id_lista_precio integer NOT NULL,
    fk_id_estado integer NOT NULL,
    tx_nombre character varying(50) NOT NULL,
    fh_inicio timestamp without time zone NOT NULL,
    fh_fin timestamp without time zone,
    st_activo boolean NOT NULL
);



--
-- TOC entry 247 (class 1259 OID 18763)
-- Name: tci03_lista_precio_id_lista_precio_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tci02_servicio_lista_precio_id_servicio_lista_precio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tci02_servicio_lista_precio_id_servicio_lista_precio_seq OWNED BY public.tci02_servicio_lista_precio.id_servicio_lista_precio;

CREATE SEQUENCE public.tci03_lista_precio_id_lista_precio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4935 (class 0 OID 0)
-- Dependencies: 247
-- Name: tci03_lista_precio_id_lista_precio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tci03_lista_precio_id_lista_precio_seq OWNED BY public.tci03_lista_precio.id_lista_precio;


--
-- TOC entry 250 (class 1259 OID 18775)
-- Name: tci05_cita; Type: TABLE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE TABLE public.tci05_cita (
    id_cita integer NOT NULL,
    fk_id_persona integer NOT NULL,
    fk_id_servicio integer NOT NULL,
    fk_id_lista_precio integer NOT NULL,
    fk_id_sucursal integer NOT NULL,
    fk_id_empleado integer NOT NULL,
    fh_cita timestamp without time zone
);



--
-- TOC entry 249 (class 1259 OID 18774)
-- Name: tci05_cita_id_cita_seq; Type: SEQUENCE; Schema: public; Owner: maximilianogonzalezcalzada
--

CREATE SEQUENCE public.tci05_cita_id_cita_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 4936 (class 0 OID 0)
-- Dependencies: 249
-- Name: tci05_cita_id_cita_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER SEQUENCE public.tci05_cita_id_cita_seq OWNED BY public.tci05_cita.id_cita;


--
-- TOC entry 4680 (class 2604 OID 18653)
-- Name: cci01_servicio id_servicio; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.cci01_servicio ALTER COLUMN id_servicio SET DEFAULT nextval('public.cci01_servicio_id_servicio_seq'::regclass);


--
-- TOC entry 4680 (class 2604 OID 18653)
-- Name: tca01_persona id_persona; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tca01_persona ALTER COLUMN id_persona SET DEFAULT nextval('public.tca01_persona_id_persona_seq'::regclass);


--
-- TOC entry 4681 (class 2604 OID 18675)
-- Name: tce01_establecimiento id_establecimiento; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce01_establecimiento ALTER COLUMN id_establecimiento SET DEFAULT nextval('public.tce01_establecimiento_id_establecimiento_seq'::regclass);


--
-- TOC entry 4682 (class 2604 OID 18684)
-- Name: tce02_sucursal id_sucursal; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce02_sucursal ALTER COLUMN id_sucursal SET DEFAULT nextval('public.tce02_sucursal_id_sucursal_seq'::regclass);


--
-- TOC entry 4683 (class 2604 OID 18704)
-- Name: tce04_dia_laboral id_dia; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce04_dia_laboral ALTER COLUMN id_dia SET DEFAULT nextval('public.tce04_dia_laboral_id_dia_seq'::regclass);


--
-- TOC entry 4684 (class 2604 OID 18715)
-- Name: tce05_dia_descanso id_dia_descanso; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce05_dia_descanso ALTER COLUMN id_dia_descanso SET DEFAULT nextval('public.tce05_dia_descanso_id_dia_descanso_seq'::regclass);


--
-- TOC entry 4685 (class 2604 OID 18738)
-- Name: tce08_horario id_horario; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce08_horario ALTER COLUMN id_horario SET DEFAULT nextval('public.tce08_horario_id_horario_seq'::regclass);


--
-- TOC entry 4686 (class 2604 OID 18750)
-- Name: tci01_estado_lista_precio id_estado; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci01_estado_lista_precio ALTER COLUMN id_estado SET DEFAULT nextval('public.tci01_estado_lista_precio_id_estado_seq'::regclass);


--
-- TOC entry 4687 (class 2604 OID 18767)
-- Name: tci03_lista_precio id_lista_precio; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci01_estado_lista_precio ALTER COLUMN id_estado SET DEFAULT nextval('public.tci01_estado_lista_precio_id_estado_seq'::regclass);

ALTER TABLE ONLY public.tci02_servicio_lista_precio ALTER COLUMN id_servicio_lista_precio SET DEFAULT nextval('public.tci02_servicio_lista_precio_id_servicio_lista_precio_seq'::regclass);

ALTER TABLE ONLY public.tci03_lista_precio ALTER COLUMN id_lista_precio SET DEFAULT nextval('public.tci03_lista_precio_id_lista_precio_seq'::regclass);


--
-- TOC entry 4688 (class 2604 OID 18778)
-- Name: tci05_cita id_cita; Type: DEFAULT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci05_cita ALTER COLUMN id_cita SET DEFAULT nextval('public.tci05_cita_id_cita_seq'::regclass);


--
-- TOC entry 4896 (class 0 OID 18621)
-- Dependencies: 225
-- Data for Name: cca01_genero; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--

INSERT INTO public.cca01_genero VALUES (1, 'Hombre', 'Hombre', true);
INSERT INTO public.cca01_genero VALUES (2, 'Mujer', 'Mujer', true);


--
-- TOC entry 4897 (class 0 OID 18630)
-- Dependencies: 226
-- Data for Name: cca02_rol; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--

INSERT INTO public.cca02_rol VALUES (1, 'Admin', 'Admin', true);
INSERT INTO public.cca02_rol VALUES (2, 'Empleado', 'Empleado', true);
INSERT INTO public.cca02_rol VALUES (3, 'Cliente', 'Cliente', true);


--
-- TOC entry 4898 (class 0 OID 18639)
-- Dependencies: 227
-- Data for Name: cci01_servicio; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4679 (class 0 OID 17858)
-- Dependencies: 221
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4900 (class 0 OID 18650)
-- Dependencies: 229
-- Data for Name: tca01_persona; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4901 (class 0 OID 18661)
-- Dependencies: 230
-- Data for Name: tca02_usuario; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4903 (class 0 OID 18672)
-- Dependencies: 232
-- Data for Name: tce01_establecimiento; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4905 (class 0 OID 18681)
-- Dependencies: 234
-- Data for Name: tce02_sucursal; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4906 (class 0 OID 18693)
-- Dependencies: 235
-- Data for Name: tce03_empleado; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4908 (class 0 OID 18701)
-- Dependencies: 237
-- Data for Name: tce04_dia_laboral; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--

INSERT INTO public.tce04_dia_laboral VALUES (1, 'Lunes', 'Día laboral ordinario', 1);
INSERT INTO public.tce04_dia_laboral VALUES (2, 'Martes', 'Día laboral ordinario', 1);
INSERT INTO public.tce04_dia_laboral VALUES (3, 'Miércoles', 'Día laboral ordinario', 1);
INSERT INTO public.tce04_dia_laboral VALUES (4, 'Jueves', 'Día laboral ordinario', 1);
INSERT INTO public.tce04_dia_laboral VALUES (5, 'Viernes', 'Día laboral ordinario', 1);
INSERT INTO public.tce04_dia_laboral VALUES (6, 'Sábado', 'Día laboral ordinario', 1);
INSERT INTO public.tce04_dia_laboral VALUES (7, 'Domingo', 'Día laboral ordinario', 1);


--
-- TOC entry 4910 (class 0 OID 18712)
-- Dependencies: 239
-- Data for Name: tce05_dia_descanso; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4911 (class 0 OID 18721)
-- Dependencies: 240
-- Data for Name: tce06_empleado_horario; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4912 (class 0 OID 18728)
-- Dependencies: 241
-- Data for Name: tce07_bloque_cita; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4914 (class 0 OID 18735)
-- Dependencies: 243
-- Data for Name: tce08_horario; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4916 (class 0 OID 18747)
-- Dependencies: 245
-- Data for Name: tci01_estado_lista_precio; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4917 (class 0 OID 18755)
-- Dependencies: 246
-- Data for Name: tci02_servicio_lista_precio; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4919 (class 0 OID 18764)
-- Dependencies: 248
-- Data for Name: tci03_lista_precio; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4921 (class 0 OID 18775)
-- Dependencies: 250
-- Data for Name: tci05_cita; Type: TABLE DATA; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4937 (class 0 OID 0)
-- Dependencies: 228
-- Name: tca01_persona_id_persona_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4938 (class 0 OID 0)
-- Dependencies: 231
-- Name: tce01_establecimiento_id_establecimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4939 (class 0 OID 0)
-- Dependencies: 233
-- Name: tce02_sucursal_id_sucursal_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4940 (class 0 OID 0)
-- Dependencies: 236
-- Name: tce04_dia_laboral_id_dia_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4941 (class 0 OID 0)
-- Dependencies: 238
-- Name: tce05_dia_descanso_id_dia_descanso_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4942 (class 0 OID 0)
-- Dependencies: 242
-- Name: tce08_horario_id_horario_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4943 (class 0 OID 0)
-- Dependencies: 244
-- Name: tci01_estado_lista_precio_id_estado_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4944 (class 0 OID 0)
-- Dependencies: 247
-- Name: tci03_lista_precio_id_lista_precio_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4945 (class 0 OID 0)
-- Dependencies: 249
-- Name: tci05_cita_id_cita_seq; Type: SEQUENCE SET; Schema: public; Owner: maximilianogonzalezcalzada
--



--
-- TOC entry 4693 (class 2606 OID 18629)
-- Name: cca01_genero cca01_genero_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.cca01_genero
    ADD CONSTRAINT cca01_genero_pkey PRIMARY KEY (id_genero);


--
-- TOC entry 4695 (class 2606 OID 18638)
-- Name: cca02_rol cca02_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.cca02_rol
    ADD CONSTRAINT cca02_rol_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 4697 (class 2606 OID 18648)
-- Name: cci01_servicio cci01_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.cci01_servicio
    ADD CONSTRAINT cci01_servicio_pkey PRIMARY KEY (id_servicio);


--
-- TOC entry 4699 (class 2606 OID 18660)
-- Name: tca01_persona tca01_persona_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tca01_persona
    ADD CONSTRAINT tca01_persona_pkey PRIMARY KEY (id_persona);


--
-- TOC entry 4701 (class 2606 OID 18670)
-- Name: tca02_usuario tca02_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tca02_usuario
    ADD CONSTRAINT tca02_usuario_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4703 (class 2606 OID 18679)
-- Name: tce01_establecimiento tce01_establecimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce01_establecimiento
    ADD CONSTRAINT tce01_establecimiento_pkey PRIMARY KEY (id_establecimiento);


--
-- TOC entry 4705 (class 2606 OID 18692)
-- Name: tce02_sucursal tce02_sucursal_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce02_sucursal
    ADD CONSTRAINT tce02_sucursal_pkey PRIMARY KEY (id_sucursal);


--
-- TOC entry 4707 (class 2606 OID 18699)
-- Name: tce03_empleado tce03_empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce03_empleado
    ADD CONSTRAINT tce03_empleado_pkey PRIMARY KEY (id_empleado);


--
-- TOC entry 4709 (class 2606 OID 18710)
-- Name: tce04_dia_laboral tce04_dia_laboral_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce04_dia_laboral
    ADD CONSTRAINT tce04_dia_laboral_pkey PRIMARY KEY (id_dia);


--
-- TOC entry 4711 (class 2606 OID 18720)
-- Name: tce05_dia_descanso tce05_dia_descanso_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce05_dia_descanso
    ADD CONSTRAINT tce05_dia_descanso_pkey PRIMARY KEY (id_dia_descanso);


--
-- TOC entry 4713 (class 2606 OID 18727)
-- Name: tce06_empleado_horario tce06_empleado_horario_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce06_empleado_horario
    ADD CONSTRAINT tce06_empleado_horario_pkey PRIMARY KEY (fk_id_horario, fk_id_persona);


--
-- TOC entry 4715 (class 2606 OID 18745)
-- Name: tce08_horario tce08_horario_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce08_horario
    ADD CONSTRAINT tce08_horario_pkey PRIMARY KEY (id_horario);


--
-- TOC entry 4717 (class 2606 OID 18754)
-- Name: tci01_estado_lista_precio tci01_estado_lista_precio_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci01_estado_lista_precio
    ADD CONSTRAINT tci01_estado_lista_precio_pkey PRIMARY KEY (id_estado);


--
-- TOC entry 4719 (class 2606 OID 18762)
-- Name: tci02_servicio_lista_precio tci02_servicio_lista_precio_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci02_servicio_lista_precio
    ADD CONSTRAINT tci02_servicio_lista_precio_pkey PRIMARY KEY (id_servicio_lista_precio);

ALTER TABLE ONLY public.tci02_servicio_lista_precio
    ADD CONSTRAINT tci02_servicio_lista_precio_unique UNIQUE (fk_id_servicio, fk_id_lista_precio);


--
-- TOC entry 4721 (class 2606 OID 18773)
-- Name: tci03_lista_precio tci03_lista_precio_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci03_lista_precio
    ADD CONSTRAINT tci03_lista_precio_pkey PRIMARY KEY (id_lista_precio);


--
-- TOC entry 4723 (class 2606 OID 18786)
-- Name: tci05_cita tci05_cita_pkey; Type: CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci05_cita
    ADD CONSTRAINT tci05_cita_pkey PRIMARY KEY (id_cita);


--
-- TOC entry 4724 (class 2606 OID 18787)
-- Name: tca01_persona fktca01_pers852780; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tca01_persona
    ADD CONSTRAINT fktca01_pers852780 FOREIGN KEY (fk_id_genero) REFERENCES public.cca01_genero(id_genero);


--
-- TOC entry 4725 (class 2606 OID 18847)
-- Name: tca02_usuario fktca02_usua571784; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tca02_usuario
    ADD CONSTRAINT fktca02_usua571784 FOREIGN KEY (fk_id_rol) REFERENCES public.cca02_rol(id_rol);


--
-- TOC entry 4726 (class 2606 OID 18792)
-- Name: tca02_usuario fktca02_usua862702; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tca02_usuario
    ADD CONSTRAINT fktca02_usua862702 FOREIGN KEY (id_usuario) REFERENCES public.tca01_persona(id_persona);


--
-- TOC entry 4727 (class 2606 OID 18822)
-- Name: tce02_sucursal fktce02_sucu179423; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce02_sucursal
    ADD CONSTRAINT fktce02_sucu179423 FOREIGN KEY (fk_id_establecimiento) REFERENCES public.tce01_establecimiento(id_establecimiento);


--
-- TOC entry 4728 (class 2606 OID 18852)
-- Name: tce03_empleado fktce03_empl270344; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce03_empleado
    ADD CONSTRAINT fktce03_empl270344 FOREIGN KEY (id_empleado) REFERENCES public.tca01_persona(id_persona);


--
-- TOC entry 4729 (class 2606 OID 18882)
-- Name: tce03_empleado fktce03_empl771275; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce03_empleado
    ADD CONSTRAINT fktce03_empl771275 FOREIGN KEY (fk_id_sucursal) REFERENCES public.tce02_sucursal(id_sucursal);


--
-- TOC entry 4730 (class 2606 OID 18867)
-- Name: tce05_dia_descanso fktce05_dia_792374; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce05_dia_descanso
    ADD CONSTRAINT fktce05_dia_792374 FOREIGN KEY (fk_id_empleado) REFERENCES public.tce03_empleado(id_empleado);


--
-- TOC entry 4731 (class 2606 OID 18857)
-- Name: tce06_empleado_horario fktce06_empl130066; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce06_empleado_horario
    ADD CONSTRAINT fktce06_empl130066 FOREIGN KEY (fk_id_persona) REFERENCES public.tce03_empleado(id_empleado);


--
-- TOC entry 4732 (class 2606 OID 18862)
-- Name: tce06_empleado_horario fktce06_empl703363; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce06_empleado_horario
    ADD CONSTRAINT fktce06_empl703363 FOREIGN KEY (fk_id_horario) REFERENCES public.tce08_horario(id_horario);


--
-- TOC entry 4733 (class 2606 OID 18842)
-- Name: tce07_bloque_cita fktce07_bloq429895; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce07_bloque_cita
    ADD CONSTRAINT fktce07_bloq429895 FOREIGN KEY (fk_id_sucursal) REFERENCES public.tce02_sucursal(id_sucursal);


--
-- TOC entry 4734 (class 2606 OID 18872)
-- Name: tce07_bloque_cita fktce07_bloq663954; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce07_bloque_cita
    ADD CONSTRAINT fktce07_bloq663954 FOREIGN KEY (fk_id_cita) REFERENCES public.tci05_cita(id_cita);


--
-- TOC entry 4735 (class 2606 OID 18827)
-- Name: tce08_horario fktce08_hora383650; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce08_horario
    ADD CONSTRAINT fktce08_hora383650 FOREIGN KEY (fk_id_sucursal) REFERENCES public.tce02_sucursal(id_sucursal);


--
-- TOC entry 4736 (class 2606 OID 18832)
-- Name: tce08_horario fktce08_hora893106; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tce08_horario
    ADD CONSTRAINT fktce08_hora893106 FOREIGN KEY (fk_id_dia) REFERENCES public.tce04_dia_laboral(id_dia);


--
-- TOC entry 4737 (class 2606 OID 18802)
-- Name: tci02_servicio_lista_precio fktci02_serv131929; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci02_servicio_lista_precio
    ADD CONSTRAINT fktci02_serv131929 FOREIGN KEY (fk_id_servicio) REFERENCES public.cci01_servicio(id_servicio);


--
-- TOC entry 4738 (class 2606 OID 18807)
-- Name: tci02_servicio_lista_precio fktci02_serv753638; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci02_servicio_lista_precio
    ADD CONSTRAINT fktci02_serv753638 FOREIGN KEY (fk_id_lista_precio) REFERENCES public.tci03_lista_precio(id_lista_precio);


--
-- TOC entry 4739 (class 2606 OID 18812)
-- Name: tci03_lista_precio fktci03_list512910; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci03_lista_precio
    ADD CONSTRAINT fktci03_list512910 FOREIGN KEY (fk_id_estado) REFERENCES public.tci01_estado_lista_precio(id_estado);


--
-- TOC entry 4740 (class 2606 OID 18817)
-- Name: tci05_cita fktci05_cita165698; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci05_cita
    ADD CONSTRAINT fktci05_cita165698 FOREIGN KEY (fk_id_servicio, fk_id_lista_precio) REFERENCES public.tci02_servicio_lista_precio(fk_id_servicio, fk_id_lista_precio);


--
-- TOC entry 4741 (class 2606 OID 18797)
-- Name: tci05_cita fktci05_cita559502; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci05_cita
    ADD CONSTRAINT fktci05_cita559502 FOREIGN KEY (fk_id_persona) REFERENCES public.tca01_persona(id_persona);


--
-- TOC entry 4742 (class 2606 OID 18837)
-- Name: tci05_cita fktci05_cita70185; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci05_cita
    ADD CONSTRAINT fktci05_cita70185 FOREIGN KEY (fk_id_sucursal) REFERENCES public.tce02_sucursal(id_sucursal);


--
-- TOC entry 4743 (class 2606 OID 18877)
-- Name: tci05_cita fktci05_cita867560; Type: FK CONSTRAINT; Schema: public; Owner: maximilianogonzalezcalzada
--

ALTER TABLE ONLY public.tci05_cita
    ADD CONSTRAINT fktci05_cita867560 FOREIGN KEY (fk_id_empleado) REFERENCES public.tce03_empleado(id_empleado);


-- Completed on 2025-12-10 15:21:39 CST

--
-- PostgreSQL database dump complete
--


