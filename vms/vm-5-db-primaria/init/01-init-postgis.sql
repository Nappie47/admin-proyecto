-- ==========================================================
-- INICIALIZACIÓN POSTGRESQL + POSTGIS (CEMENTERIO GENERAL)
-- Requisitos: RF09 (Ubicación Geográfica), RF10 (Visualización Cartográfica)
-- ==========================================================

-- 1. Habilitar extensiones geoespaciales PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. Configurar zona horaria oficial de Chile
SET timezone = 'America/Santiago';

-- 3. Crear usuario para streaming replication hacia VM-6 (Réplica)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'replicator') THEN
      CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator123';
   END IF;
END
$do$;

-- 4. Crear usuario de aplicación backend Flask (app_user)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'app_user') THEN
      CREATE USER app_user WITH ENCRYPTED PASSWORD 'AppPassword123!';
   END IF;
END
$do$;

-- 5. Otorgar permisos completos sobre la base de datos y esquemas
GRANT ALL PRIVILEGES ON DATABASE cementerio_db TO app_user;
GRANT ALL ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO app_user;

-- 6. Notificación en log
DO $$
BEGIN
    RAISE NOTICE 'Base de datos Cementerio General inicializada con PostGIS y usuarios (app_user, replicator) exitosamente.';
END $$;

