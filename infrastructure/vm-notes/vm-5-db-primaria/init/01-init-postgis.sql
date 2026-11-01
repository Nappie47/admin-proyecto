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

-- 4. Notificación en log
DO $$
BEGIN
    RAISE NOTICE 'Base de datos Cementerio General inicializada con PostGIS exitosamente.';
END $$;
