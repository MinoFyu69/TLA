--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

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
-- Name: approve_peminjaman(integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.approve_peminjaman(p_id_peminjaman integer, p_status character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_status = 'disetujui' THEN
        UPDATE peminjaman
        SET status = 'disetujui'
        WHERE id_peminjaman = p_id_peminjaman;

        UPDATE alat
        SET status = 'dipinjam'
        WHERE id_alat = (
            SELECT id_alat FROM peminjaman
            WHERE id_peminjaman = p_id_peminjaman
        );
    ELSE
        UPDATE peminjaman
        SET status = 'ditolak'
        WHERE id_peminjaman = p_id_peminjaman;
    END IF;
END;
$$;


ALTER FUNCTION public.approve_peminjaman(p_id_peminjaman integer, p_status character varying) OWNER TO postgres;

--
-- Name: log_peminjaman(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_peminjaman() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO log_aktivitas (id_user, aktivitas)
    VALUES (NEW.id_user, 'Mengajukan peminjaman alat');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_peminjaman() OWNER TO postgres;

--
-- Name: log_pengembalian(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_pengembalian() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO log_aktivitas (aktivitas)
    VALUES ('Pengembalian alat diproses');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_pengembalian() OWNER TO postgres;

--
-- Name: proses_pengembalian(integer, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.proses_pengembalian(p_id_peminjaman integer, p_tanggal_kembali date) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    selisih INT;
    total_denda INT := 0;
BEGIN
    SELECT p_tanggal_kembali - tanggal_kembali_rencana
    INTO selisih
    FROM peminjaman
    WHERE id_peminjaman = p_id_peminjaman;

    IF selisih > 0 THEN
        total_denda := selisih * 5000;
    END IF;

    INSERT INTO pengembalian (id_peminjaman, tanggal_kembali, denda)
    VALUES (p_id_peminjaman, p_tanggal_kembali, total_denda);

    UPDATE peminjaman
    SET status = 'dikembalikan'
    WHERE id_peminjaman = p_id_peminjaman;

    UPDATE alat
    SET status = 'tersedia'
    WHERE id_alat = (
        SELECT id_alat FROM peminjaman
        WHERE id_peminjaman = p_id_peminjaman
    );
END;
$$;


ALTER FUNCTION public.proses_pengembalian(p_id_peminjaman integer, p_tanggal_kembali date) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alat (
    id_alat integer NOT NULL,
    nama_alat character varying(100) NOT NULL,
    id_kategori integer,
    kondisi character varying(20) DEFAULT 'baik'::character varying,
    status character varying(20) DEFAULT 'tersedia'::character varying,
    CONSTRAINT alat_kondisi_check CHECK (((kondisi)::text = ANY ((ARRAY['baik'::character varying, 'rusak'::character varying])::text[]))),
    CONSTRAINT alat_status_check CHECK (((status)::text = ANY ((ARRAY['tersedia'::character varying, 'dipinjam'::character varying])::text[])))
);


ALTER TABLE public.alat OWNER TO postgres;

--
-- Name: alat_id_alat_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alat_id_alat_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alat_id_alat_seq OWNER TO postgres;

--
-- Name: alat_id_alat_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alat_id_alat_seq OWNED BY public.alat.id_alat;


--
-- Name: kategori; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kategori (
    id_kategori integer NOT NULL,
    nama_kategori character varying(100) NOT NULL,
    deskripsi text
);


ALTER TABLE public.kategori OWNER TO postgres;

--
-- Name: kategori_id_kategori_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kategori_id_kategori_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kategori_id_kategori_seq OWNER TO postgres;

--
-- Name: kategori_id_kategori_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kategori_id_kategori_seq OWNED BY public.kategori.id_kategori;


--
-- Name: log_aktivitas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_aktivitas (
    id_log integer NOT NULL,
    id_user integer,
    aktivitas text NOT NULL,
    waktu timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.log_aktivitas OWNER TO postgres;

--
-- Name: log_aktivitas_id_log_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_aktivitas_id_log_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_aktivitas_id_log_seq OWNER TO postgres;

--
-- Name: log_aktivitas_id_log_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_aktivitas_id_log_seq OWNED BY public.log_aktivitas.id_log;


--
-- Name: peminjaman; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peminjaman (
    id_peminjaman integer NOT NULL,
    id_user integer,
    id_alat integer,
    tanggal_pinjam date NOT NULL,
    tanggal_kembali_rencana date NOT NULL,
    status character varying(20) DEFAULT 'menunggu'::character varying,
    CONSTRAINT peminjaman_status_check CHECK (((status)::text = ANY ((ARRAY['menunggu'::character varying, 'disetujui'::character varying, 'ditolak'::character varying, 'dikembalikan'::character varying])::text[])))
);


ALTER TABLE public.peminjaman OWNER TO postgres;

--
-- Name: peminjaman_id_peminjaman_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peminjaman_id_peminjaman_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peminjaman_id_peminjaman_seq OWNER TO postgres;

--
-- Name: peminjaman_id_peminjaman_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peminjaman_id_peminjaman_seq OWNED BY public.peminjaman.id_peminjaman;


--
-- Name: pengembalian; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengembalian (
    id_pengembalian integer NOT NULL,
    id_peminjaman integer,
    tanggal_kembali date NOT NULL,
    denda integer DEFAULT 0
);


ALTER TABLE public.pengembalian OWNER TO postgres;

--
-- Name: pengembalian_id_pengembalian_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengembalian_id_pengembalian_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengembalian_id_pengembalian_seq OWNER TO postgres;

--
-- Name: pengembalian_id_pengembalian_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengembalian_id_pengembalian_seq OWNED BY public.pengembalian.id_pengembalian;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id_user integer NOT NULL,
    nama character varying(100) NOT NULL,
    username character varying(50) NOT NULL,
    password text NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'petugas'::character varying, 'peminjam'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_user_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_user_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_user_seq OWNER TO postgres;

--
-- Name: users_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_user_seq OWNED BY public.users.id_user;


--
-- Name: alat id_alat; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alat ALTER COLUMN id_alat SET DEFAULT nextval('public.alat_id_alat_seq'::regclass);


--
-- Name: kategori id_kategori; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori ALTER COLUMN id_kategori SET DEFAULT nextval('public.kategori_id_kategori_seq'::regclass);


--
-- Name: log_aktivitas id_log; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktivitas ALTER COLUMN id_log SET DEFAULT nextval('public.log_aktivitas_id_log_seq'::regclass);


--
-- Name: peminjaman id_peminjaman; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman ALTER COLUMN id_peminjaman SET DEFAULT nextval('public.peminjaman_id_peminjaman_seq'::regclass);


--
-- Name: pengembalian id_pengembalian; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengembalian ALTER COLUMN id_pengembalian SET DEFAULT nextval('public.pengembalian_id_pengembalian_seq'::regclass);


--
-- Name: users id_user; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id_user SET DEFAULT nextval('public.users_id_user_seq'::regclass);


--
-- Name: alat alat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alat
    ADD CONSTRAINT alat_pkey PRIMARY KEY (id_alat);


--
-- Name: kategori kategori_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori
    ADD CONSTRAINT kategori_pkey PRIMARY KEY (id_kategori);


--
-- Name: log_aktivitas log_aktivitas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktivitas
    ADD CONSTRAINT log_aktivitas_pkey PRIMARY KEY (id_log);


--
-- Name: peminjaman peminjaman_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman
    ADD CONSTRAINT peminjaman_pkey PRIMARY KEY (id_peminjaman);


--
-- Name: pengembalian pengembalian_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengembalian
    ADD CONSTRAINT pengembalian_pkey PRIMARY KEY (id_pengembalian);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_user);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: peminjaman trg_peminjaman; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_peminjaman AFTER INSERT ON public.peminjaman FOR EACH ROW EXECUTE FUNCTION public.log_peminjaman();


--
-- Name: pengembalian trg_pengembalian; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pengembalian AFTER INSERT ON public.pengembalian FOR EACH ROW EXECUTE FUNCTION public.log_pengembalian();


--
-- Name: alat alat_id_kategori_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alat
    ADD CONSTRAINT alat_id_kategori_fkey FOREIGN KEY (id_kategori) REFERENCES public.kategori(id_kategori) ON DELETE SET NULL;


--
-- Name: log_aktivitas log_aktivitas_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktivitas
    ADD CONSTRAINT log_aktivitas_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON DELETE SET NULL;


--
-- Name: peminjaman peminjaman_id_alat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman
    ADD CONSTRAINT peminjaman_id_alat_fkey FOREIGN KEY (id_alat) REFERENCES public.alat(id_alat) ON DELETE CASCADE;


--
-- Name: peminjaman peminjaman_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman
    ADD CONSTRAINT peminjaman_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON DELETE CASCADE;


--
-- Name: pengembalian pengembalian_id_peminjaman_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengembalian
    ADD CONSTRAINT pengembalian_id_peminjaman_fkey FOREIGN KEY (id_peminjaman) REFERENCES public.peminjaman(id_peminjaman) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

