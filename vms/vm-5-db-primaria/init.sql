-- Creación de la base de datos e inicialización de extensiones
CREATE DATABASE cementerio_db;

\c cementerio_db

-- Habilitar extensión geoespacial
CREATE EXTENSION IF NOT EXISTS postgis;

-- Crear usuario para el Backend Flask
CREATE USER app_user WITH ENCRYPTED PASSWORD 'AppPassword123!';
GRANT ALL PRIVILEGES ON DATABASE cementerio_db TO app_user;
GRANT ALL ON SCHEMA public TO app_user;
