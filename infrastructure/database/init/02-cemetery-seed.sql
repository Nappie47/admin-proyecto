-- Poblamiento inicial automatico para despliegues limpios (Unidad 2)
SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

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
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: mausoleos_historicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mausoleos_historicos (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    familia character varying(120),
    ano_construccion integer,
    arquitecto character varying(120),
    estilo_arquitectonico character varying(100),
    resena_historica text NOT NULL,
    foto_url character varying(300),
    patio_id integer,
    latitud double precision NOT NULL,
    longitud double precision NOT NULL,
    geom_geojson text,
    destacado boolean,
    created_at timestamp without time zone
);


--
-- Name: mausoleos_historicos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mausoleos_historicos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mausoleos_historicos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mausoleos_historicos_id_seq OWNED BY public.mausoleos_historicos.id;


--
-- Name: patios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patios (
    id integer NOT NULL,
    numero integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    superficie_m2 double precision,
    color_hex character varying(10),
    geom_geojson text,
    created_at timestamp without time zone
);


--
-- Name: patios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patios_id_seq OWNED BY public.patios.id;


--
-- Name: sepulturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sepulturas (
    id integer NOT NULL,
    numero character varying(30) NOT NULL,
    patio_id integer NOT NULL,
    sector character varying(30) NOT NULL,
    tipo character varying(40) NOT NULL,
    estado character varying(30) NOT NULL,
    nombre_fallecido character varying(120),
    apellido_paterno character varying(120),
    apellido_materno character varying(120),
    fecha_nacimiento date,
    fecha_fallecimiento date,
    observaciones text,
    ubicacion_detalle character varying(150),
    latitud double precision NOT NULL,
    longitud double precision NOT NULL,
    geom_geojson text,
    is_deleted boolean NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: sepulturas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sepulturas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sepulturas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sepulturas_id_seq OWNED BY public.sepulturas.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(80) NOT NULL,
    email character varying(120) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    rol character varying(30) NOT NULL,
    activo boolean NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: mausoleos_historicos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mausoleos_historicos ALTER COLUMN id SET DEFAULT nextval('public.mausoleos_historicos_id_seq'::regclass);


--
-- Name: patios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patios ALTER COLUMN id SET DEFAULT nextval('public.patios_id_seq'::regclass);


--
-- Name: sepulturas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sepulturas ALTER COLUMN id SET DEFAULT nextval('public.sepulturas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: mausoleos_historicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, foto_url, patio_id, latitud, longitud, geom_geojson, destacado, created_at) FROM stdin;
1	Mausoleo Familia de la Maza y Riquelme	Familia de la Maza	1885	Taller de Cantería y Mármol del Biobío	Neoclásico Republicano con ornamentación floral	Monumento de gran altura y valor histórico donde descansan descendientes directos vinculados a Clorinda Riquelme de la Barrera del Río (prima hermana del Libertador Bernardo O'Higgins) y propietarios del histórico fundo Paillihue.	/images/mausoleos/mausoleo_1.jpg	1	-37.47275	-72.3223	{"type": "Point", "coordinates": [-72.3223, -37.47275]}	t	2026-11-02 13:20:19.332429
2	Mausoleo Fundacional Familia Robles	Familia Robles	1860	Constructor José Tomás Robles	Clásico en piedra sillar y columnas dóricas	Panteón de la familia benefactora que en 1850 donó los terrenos fundacionales para la creación del camposanto laico y público de Los Ángeles, dando inicio formal a la administración municipal del recinto.	/images/mausoleos/mausoleo_2.jpg	1	-37.4725	-72.3227	{"type": "Point", "coordinates": [-72.3227, -37.4725]}	t	2026-11-02 13:20:19.332429
3	Mausoleo Colonos de Humán e Inmigrantes Europeos	Comunidad de Inmigrantes y Disidentes	1872	Colonos Constructores de Humán	Neogótico Germánico en granito	Ubicado en el acceso del camposanto. Alberga los restos de los primeros colonos alemanes, suizos y austrohúngaros establecidos en la Colonia Humán a mediados del siglo XIX, hito fundacional de la provincia.	/images/mausoleos/mausoleo_3.jpg	1	-37.4731	-72.3218	{"type": "Point", "coordinates": [-72.3218, -37.4731]}	t	2026-11-02 13:20:19.332429
4	Mausoleo Sociedad de Socorros Mutuos de Artesanos	Sociedad de Artesanos de Los Ángeles	1912	Gremio de Albañilería y Mutualistas de Los Ángeles	Neoclásico Cívico Institucional	Panteón social erigido por la mutual obrera y artesana fundada a fines del siglo XIX. Representa el espíritu de solidaridad gremial y las raíces del mutualismo en la ciudad de Los Ángeles.	/images/mausoleos/mausoleo_4.jpg	2	-37.4733	-72.3235	{"type": "Point", "coordinates": [-72.3235, -37.4733]}	t	2026-11-02 13:20:19.332429
5	Mausoleo Familia Rioseco y Bunster	Familia Rioseco Bunster	1898	Estudio Arquitectura Concepción-Los Ángeles	Historicista Ecléctico con bóveda de medio punto	Panteón de una de las familias precursoras de la agricultura moderna, la industria molinera y la llegada del ferrocarril a la cuenca del Biobío durante el auge cerealero del siglo XIX.	/images/mausoleos/mausoleo_5.jpg	2	-37.47355	-72.3241	{"type": "Point", "coordinates": [-72.3241, -37.47355]}	t	2026-11-02 13:20:19.332429
6	Panteón Memorial Anita Figueroa y Carmen Luisa Olivares (Las Profesoras)	Comunidad Educativa Angelína	1948	Memorial Cívico Municipal	Memorial de Veneración y Devoción Popular	Sepultura patrimonial de las recordadas educadoras angelinas Anita Figueroa y Carmen Luisa Olivares. Sitio de constante peregrinación cívica y tradición devocional con placas de gratitud comunal.	/images/mausoleos/mausoleo_6.jpg	2	-37.47315	-72.3231	{"type": "Point", "coordinates": [-72.3231, -37.47315]}	t	2026-11-02 13:20:19.332429
7	Mausoleo Familia Castro Rojas (Santiago Patricio Castro)	Familia Castro Rojas	1965	Diseño Cívico Regional	Sobrio Contemporáneo en mármol y bronce	Lugar de descanso de Santiago Patricio Castro Rojas, notable educador y ciudadano ilustre recordado por haber diseñado la Bandera Oficial de la Comuna de Los Ángeles, aprobada por el municipio.	/images/mausoleos/mausoleo_7.jpg	3	-37.4729	-72.3249	{"type": "Point", "coordinates": [-72.3249, -37.4729]}	t	2026-11-02 13:20:19.332429
\.


--
-- Data for Name: patios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patios (id, numero, nombre, descripcion, superficie_m2, color_hex, geom_geojson, created_at) FROM stdin;
1	1	Patio de los Inmigrantes y Fundadores	Sector fundacional de 1850 donado por la familia Robles. Alberga el histórico Patio de Disidentes y las tumbas de los colonos europeos de la Colonia Humán.	2850	#2d6a4f	{"type": "Polygon", "coordinates": [[[-72.3235, -37.4722], [-72.3214, -37.4722], [-72.3214, -37.4734], [-72.3235, -37.4734], [-72.3235, -37.4722]]]}	2026-11-02 13:20:19.332429
2	2	Patio Los Cipreses (Avenida Patrimonial)	Eje central histórico del cementerio. Concentra los mausoleos de mayor valor arquitectónico, neoclásicos y mutualistas de la provincia del Biobío.	3200	#1b4332	{"type": "Polygon", "coordinates": [[[-72.3248, -37.4728], [-72.3226, -37.4728], [-72.3226, -37.4739], [-72.3248, -37.4739], [-72.3248, -37.4728]]]}	2026-11-02 13:20:19.332429
3	3	Patio San José (Sector Norte)	Sector norponiente de sepulturas tradicionales, bóvedas de cantería y nichos perpetuos de familias angelinas tradicionales.	2900	#40916c	{"type": "Polygon", "coordinates": [[[-72.3259, -37.4723], [-72.3237, -37.4723], [-72.3237, -37.4735], [-72.3259, -37.4735], [-72.3259, -37.4723]]]}	2026-11-02 13:20:19.332429
4	4	Patio El Carmen (Sector Sur)	Sector sur tradicional de sepulturas en tierra y jardines perpetuos de la comunidad angelina.	2750	#52b788	{"type": "Polygon", "coordinates": [[[-72.3235, -37.4735], [-72.3214, -37.4735], [-72.3214, -37.4746], [-72.3235, -37.4746], [-72.3235, -37.4735]]]}	2026-11-02 13:20:19.332429
5	5	Patio Las Acacias (Sector Poniente)	Sector suroeste con parcelas familiares contemporáneas y mausoleos modernos de la segunda mitad del siglo XX.	2800	#74c69d	{"type": "Polygon", "coordinates": [[[-72.3258, -37.4736], [-72.3236, -37.4736], [-72.3236, -37.4746], [-72.3258, -37.4746], [-72.3258, -37.4736]]]}	2026-11-02 13:20:19.332429
\.


--
-- Data for Name: sepulturas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at) FROM stdin;
1	P1-A-101	1	A	Bóveda Familiar	Ocupada	Juan	Silva	Silva	1928-05-12	1961-10-24	Inhumación registrada en Libro Catastral Folio 792.	Fila 1, Lote 1, Sector A	-37.473186	-72.323197	{"type": "Point", "coordinates": [-72.323197, -37.473186]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
2	P1-A-102	1	A	Nicho Perpetuo	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 2, Sector A	-37.473176	-72.322795	{"type": "Point", "coordinates": [-72.322795, -37.473176]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
3	P1-A-103	1	A	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 3, Sector A	-37.473191	-72.322497	{"type": "Point", "coordinates": [-72.322497, -37.473191]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
4	P1-A-104	1	A	Individual	En Mantenimiento	Gladys	González	Espinoza	1932-05-12	2021-10-24	Inhumación registrada en Libro Catastral Folio 529.	Fila 2, Lote 1, Sector A	-37.473041	-72.323177	{"type": "Point", "coordinates": [-72.323177, -37.473041]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
5	P1-A-105	1	A	Bóveda Familiar	Ocupada	Carlos	Soto	Hernández	1941-05-12	1978-10-24	Inhumación registrada en Libro Catastral Folio 259.	Fila 2, Lote 2, Sector A	-37.473028	-72.322791	{"type": "Point", "coordinates": [-72.322791, -37.473028]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
6	P1-A-106	1	A	Nicho Perpetuo	Ocupada	Rosa	Rojas	Fuentes	1926-05-12	1991-10-24	Inhumación registrada en Libro Catastral Folio 452.	Fila 2, Lote 3, Sector A	-37.473028	-72.322424	{"type": "Point", "coordinates": [-72.322424, -37.473028]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
7	P1-A-107	1	A	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 1, Sector A	-37.47279	-72.323119	{"type": "Point", "coordinates": [-72.323119, -37.47279]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
8	P1-A-108	1	A	Individual	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 2, Sector A	-37.472777	-72.322796	{"type": "Point", "coordinates": [-72.322796, -37.472777]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
9	P1-A-109	1	A	Bóveda Familiar	En Mantenimiento	Patricia	Sepúlveda	Castillo	1976-05-12	2023-10-24	Inhumación registrada en Libro Catastral Folio 470.	Fila 3, Lote 3, Sector A	-37.472753	-72.322462	{"type": "Point", "coordinates": [-72.322462, -37.472753]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
10	P1-A-110	1	A	Nicho Perpetuo	Ocupada	María	Silva	Sepúlveda	1925-05-12	1974-10-24	Inhumación registrada en Libro Catastral Folio 203.	Fila 4, Lote 1, Sector A	-37.472592	-72.32313	{"type": "Point", "coordinates": [-72.32313, -37.472592]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
11	P2-B-101	2	B	Bóveda Familiar	Ocupada	Teresa	Soto	Rodríguez	1942-05-12	1975-10-24	Inhumación registrada en Libro Catastral Folio 786.	Fila 1, Lote 1, Sector B	-37.473729	-72.324438	{"type": "Point", "coordinates": [-72.324438, -37.473729]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
12	P2-B-102	2	B	Nicho Perpetuo	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 2, Sector B	-37.47374	-72.324023	{"type": "Point", "coordinates": [-72.324023, -37.47374]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
13	P2-B-103	2	B	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 3, Sector B	-37.473702	-72.323689	{"type": "Point", "coordinates": [-72.323689, -37.473702]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
14	P2-B-104	2	B	Individual	En Mantenimiento	Ana	Torres	Fuentes	1937-05-12	1985-10-24	Inhumación registrada en Libro Catastral Folio 801.	Fila 2, Lote 1, Sector B	-37.473566	-72.32441	{"type": "Point", "coordinates": [-72.32441, -37.473566]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
15	P2-B-105	2	B	Bóveda Familiar	Ocupada	María	Silva	Muñoz	1971-05-12	2011-10-24	Inhumación registrada en Libro Catastral Folio 510.	Fila 2, Lote 2, Sector B	-37.473551	-72.32404	{"type": "Point", "coordinates": [-72.32404, -37.473551]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
16	P2-B-106	2	B	Nicho Perpetuo	Ocupada	Víctor	López	Contreras	1961-05-12	2012-10-24	Inhumación registrada en Libro Catastral Folio 505.	Fila 2, Lote 3, Sector B	-37.473557	-72.323729	{"type": "Point", "coordinates": [-72.323729, -37.473557]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
17	P2-B-107	2	B	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 1, Sector B	-37.473312	-72.324419	{"type": "Point", "coordinates": [-72.324419, -37.473312]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
18	P2-B-108	2	B	Individual	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 2, Sector B	-37.473386	-72.324103	{"type": "Point", "coordinates": [-72.324103, -37.473386]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
19	P2-B-109	2	B	Bóveda Familiar	En Mantenimiento	Víctor	Hernández	Valenzuela	1945-05-12	1988-10-24	Inhumación registrada en Libro Catastral Folio 324.	Fila 3, Lote 3, Sector B	-37.473326	-72.323696	{"type": "Point", "coordinates": [-72.323696, -37.473326]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
20	P2-B-110	2	B	Nicho Perpetuo	Ocupada	Marta	Rojas	Muñoz	1975-05-12	1998-10-24	Inhumación registrada en Libro Catastral Folio 256.	Fila 4, Lote 1, Sector B	-37.473117	-72.32447	{"type": "Point", "coordinates": [-72.32447, -37.473117]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
21	P3-C-101	3	C	Bóveda Familiar	Ocupada	Lucía	Castillo	Rojas	1944-05-12	1988-10-24	Inhumación registrada en Libro Catastral Folio 710.	Fila 1, Lote 1, Sector C	-37.473287	-72.325504	{"type": "Point", "coordinates": [-72.325504, -37.473287]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
22	P3-C-102	3	C	Nicho Perpetuo	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 2, Sector C	-37.47325	-72.325164	{"type": "Point", "coordinates": [-72.325164, -37.47325]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
23	P3-C-103	3	C	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 3, Sector C	-37.473253	-72.324764	{"type": "Point", "coordinates": [-72.324764, -37.473253]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
24	P3-C-104	3	C	Individual	En Mantenimiento	Patricia	Morales	López	1927-05-12	1984-10-24	Inhumación registrada en Libro Catastral Folio 545.	Fila 2, Lote 1, Sector C	-37.473149	-72.325511	{"type": "Point", "coordinates": [-72.325511, -37.473149]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
25	P3-C-105	3	C	Bóveda Familiar	Ocupada	Juan	Flores	Soto	1952-05-12	1978-10-24	Inhumación registrada en Libro Catastral Folio 740.	Fila 2, Lote 2, Sector C	-37.473134	-72.325216	{"type": "Point", "coordinates": [-72.325216, -37.473134]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
26	P3-C-106	3	C	Nicho Perpetuo	Ocupada	Gladys	Contreras	Pérez	1943-05-12	2011-10-24	Inhumación registrada en Libro Catastral Folio 265.	Fila 2, Lote 3, Sector C	-37.47312	-72.324786	{"type": "Point", "coordinates": [-72.324786, -37.47312]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
27	P3-C-107	3	C	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 1, Sector C	-37.472896	-72.325505	{"type": "Point", "coordinates": [-72.325505, -37.472896]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
28	P3-C-108	3	C	Individual	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 2, Sector C	-37.472897	-72.325217	{"type": "Point", "coordinates": [-72.325217, -37.472897]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
29	P3-C-109	3	C	Bóveda Familiar	En Mantenimiento	Teresa	Sepúlveda	Silva	1923-05-12	1973-10-24	Inhumación registrada en Libro Catastral Folio 680.	Fila 3, Lote 3, Sector C	-37.472918	-72.324848	{"type": "Point", "coordinates": [-72.324848, -37.472918]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
30	P3-C-110	3	C	Nicho Perpetuo	Ocupada	Marta	Rojas	Espinoza	1969-05-12	1997-10-24	Inhumación registrada en Libro Catastral Folio 231.	Fila 4, Lote 1, Sector C	-37.472655	-72.325575	{"type": "Point", "coordinates": [-72.325575, -37.472655]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
31	P4-D-101	4	D	Bóveda Familiar	Ocupada	Ana	Morales	Flores	1975-05-12	2014-10-24	Inhumación registrada en Libro Catastral Folio 533.	Fila 1, Lote 1, Sector D	-37.474401	-72.323105	{"type": "Point", "coordinates": [-72.323105, -37.474401]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
32	P4-D-102	4	D	Nicho Perpetuo	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 2, Sector D	-37.47437	-72.322757	{"type": "Point", "coordinates": [-72.322757, -37.47437]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
33	P4-D-103	4	D	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 3, Sector D	-37.474391	-72.322431	{"type": "Point", "coordinates": [-72.322431, -37.474391]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
34	P4-D-104	4	D	Individual	En Mantenimiento	Teresa	Torres	Flores	1948-05-12	1975-10-24	Inhumación registrada en Libro Catastral Folio 353.	Fila 2, Lote 1, Sector D	-37.474212	-72.32316	{"type": "Point", "coordinates": [-72.32316, -37.474212]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
35	P4-D-105	4	D	Bóveda Familiar	Ocupada	Víctor	Espinoza	Silva	1957-05-12	1991-10-24	Inhumación registrada en Libro Catastral Folio 107.	Fila 2, Lote 2, Sector D	-37.474261	-72.322816	{"type": "Point", "coordinates": [-72.322816, -37.474261]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
36	P4-D-106	4	D	Nicho Perpetuo	Ocupada	Elena	Rojas	Muñoz	1975-05-12	2005-10-24	Inhumación registrada en Libro Catastral Folio 172.	Fila 2, Lote 3, Sector D	-37.474276	-72.322437	{"type": "Point", "coordinates": [-72.322437, -37.474276]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
37	P4-D-107	4	D	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 1, Sector D	-37.474049	-72.323172	{"type": "Point", "coordinates": [-72.323172, -37.474049]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
38	P4-D-108	4	D	Individual	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 2, Sector D	-37.474051	-72.322796	{"type": "Point", "coordinates": [-72.322796, -37.474051]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
39	P4-D-109	4	D	Bóveda Familiar	En Mantenimiento	Víctor	Araya	Silva	1970-05-12	2020-10-24	Inhumación registrada en Libro Catastral Folio 516.	Fila 3, Lote 3, Sector D	-37.474028	-72.322412	{"type": "Point", "coordinates": [-72.322412, -37.474028]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
40	P4-D-110	4	D	Nicho Perpetuo	Ocupada	Lucía	Rodríguez	Hernández	1946-05-12	1995-10-24	Inhumación registrada en Libro Catastral Folio 846.	Fila 4, Lote 1, Sector D	-37.473898	-72.32319	{"type": "Point", "coordinates": [-72.32319, -37.473898]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
41	P5-E-101	5	E	Bóveda Familiar	Ocupada	Rosa	Muñoz	Fuentes	1966-05-12	2007-10-24	Inhumación registrada en Libro Catastral Folio 211.	Fila 1, Lote 1, Sector E	-37.474478	-72.325418	{"type": "Point", "coordinates": [-72.325418, -37.474478]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
42	P5-E-102	5	E	Nicho Perpetuo	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 2, Sector E	-37.474458	-72.325098	{"type": "Point", "coordinates": [-72.325098, -37.474458]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
43	P5-E-103	5	E	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 1, Lote 3, Sector E	-37.474438	-72.324708	{"type": "Point", "coordinates": [-72.324708, -37.474438]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
44	P5-E-104	5	E	Individual	En Mantenimiento	José	Torres	Espinoza	1926-05-12	1952-10-24	Inhumación registrada en Libro Catastral Folio 767.	Fila 2, Lote 1, Sector E	-37.474289	-72.325458	{"type": "Point", "coordinates": [-72.325458, -37.474289]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
45	P5-E-105	5	E	Bóveda Familiar	Ocupada	José	Silva	Soto	1946-05-12	1997-10-24	Inhumación registrada en Libro Catastral Folio 592.	Fila 2, Lote 2, Sector E	-37.474217	-72.325033	{"type": "Point", "coordinates": [-72.325033, -37.474217]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
46	P5-E-106	5	E	Nicho Perpetuo	Ocupada	María	Soto	Fuentes	1920-05-12	1989-10-24	Inhumación registrada en Libro Catastral Folio 371.	Fila 2, Lote 3, Sector E	-37.474295	-72.32471	{"type": "Point", "coordinates": [-72.32471, -37.474295]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
47	P5-E-107	5	E	Mausoleo Familiar	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 1, Sector E	-37.474057	-72.325405	{"type": "Point", "coordinates": [-72.325405, -37.474057]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
48	P5-E-108	5	E	Individual	Disponible	\N	\N	\N	\N	\N	Sepultura disponible para asignación municipal.	Fila 3, Lote 2, Sector E	-37.474121	-72.325047	{"type": "Point", "coordinates": [-72.325047, -37.474121]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
49	P5-E-109	5	E	Bóveda Familiar	En Mantenimiento	Marta	Pérez	Contreras	1938-05-12	1985-10-24	Inhumación registrada en Libro Catastral Folio 159.	Fila 3, Lote 3, Sector E	-37.474077	-72.324672	{"type": "Point", "coordinates": [-72.324672, -37.474077]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
50	P5-E-110	5	E	Nicho Perpetuo	Ocupada	Manuel	Muñoz	Muñoz	1957-05-12	2007-10-24	Inhumación registrada en Libro Catastral Folio 614.	Fila 4, Lote 1, Sector E	-37.473925	-72.325429	{"type": "Point", "coordinates": [-72.325429, -37.473925]}	f	2026-11-02 13:20:19.332429	2026-11-02 13:20:19.332429
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, username, email, password_hash, nombre_completo, rol, activo, created_at, updated_at) FROM stdin;
1	admin	admin@losangeles.cl	$2b$12$aqo8B0mj8ksk081d8GTOyuJFtuzfhKZvu6G1SoirBfBcduoFAB.SO	Administrador General Municipal	administrador	t	2026-11-01 02:41:13.203822	2026-11-01 02:41:13.203826
2	funcionario	funcionario@losangeles.cl	$2b$12$wY1RPatp1p/fRIVsCm7P2u6mfbjAQAHixFKPKKo2v2yTOdiDz5QWG	Juan Encargado Catastro	funcionario	t	2026-11-01 02:41:03.149127	2026-11-01 02:41:03.149132
3	terreno	terreno@losangeles.cl	$2b$12$oLW8AbQK/Ev.oWd2YB5pz.yD5cv4x2fBNTbSlMA8/UgMgvj.coOz.	Validador Topográfico Terreno	funcionario	t	2026-11-01 02:41:03.391079	2026-11-01 02:41:03.391082
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: -
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: -
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: mausoleos_historicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mausoleos_historicos_id_seq', 1, false);


--
-- Name: patios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patios_id_seq', 1, false);


--
-- Name: sepulturas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sepulturas_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 3, true);


--
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: -
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- Name: mausoleos_historicos mausoleos_historicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mausoleos_historicos
    ADD CONSTRAINT mausoleos_historicos_pkey PRIMARY KEY (id);


--
-- Name: patios patios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patios
    ADD CONSTRAINT patios_pkey PRIMARY KEY (id);


--
-- Name: sepulturas sepulturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sepulturas
    ADD CONSTRAINT sepulturas_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: ix_patios_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_patios_numero ON public.patios USING btree (numero);


--
-- Name: ix_sepulturas_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sepulturas_numero ON public.sepulturas USING btree (numero);


--
-- Name: ix_sepulturas_patio_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sepulturas_patio_id ON public.sepulturas USING btree (patio_id);


--
-- Name: ix_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: ix_usuarios_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_usuarios_username ON public.usuarios USING btree (username);


--
-- Name: mausoleos_historicos mausoleos_historicos_patio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mausoleos_historicos
    ADD CONSTRAINT mausoleos_historicos_patio_id_fkey FOREIGN KEY (patio_id) REFERENCES public.patios(id);


--
-- Name: sepulturas sepulturas_patio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sepulturas
    ADD CONSTRAINT sepulturas_patio_id_fkey FOREIGN KEY (patio_id) REFERENCES public.patios(id);


--
-- PostgreSQL database dump complete
--

