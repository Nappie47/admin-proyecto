#!/usr/bin/env bash
# ==============================================================================
# Script de Restauración de Base de Datos PostgreSQL + PostGIS (HA)
# Proyecto: SIG Cementerio General de Los Ángeles (Unidad 2)
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"

if [ -f "${PROJECT_ROOT}/.env" ]; then
    # shellcheck disable=SC1091
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
fi

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-cementerio_db}"
DB_HOST="${DB_HOST:-}"
CONTAINER_NAME="sig_db_primary"

echo "================================================================="
echo " [SIG CEMENTERIO] Procedimiento de Restauración (Restore)"
echo " Base de datos destino: ${DB_NAME} (Host: ${DB_HOST:-contenedor local})"
echo "================================================================="

if [ -z "${DB_HOST}" ] || [ "${DB_HOST}" = "localhost" ] || [ "${DB_HOST}" = "127.0.0.1" ]; then
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "[ERROR] El contenedor '${CONTAINER_NAME}' no está en ejecución."
        exit 1
    fi
fi

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "[INFO] No se especificó archivo. Buscando el respaldo más reciente..."
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/cementerio_db_*.sql.gz 2>/dev/null | head -n 1 || true)
    if [ -z "${LATEST_BACKUP}" ]; then
        echo "[ERROR] No se encontraron archivos de respaldo en ${BACKUP_DIR}."
        exit 1
    fi
    BACKUP_FILE="${LATEST_BACKUP}"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[ERROR] El archivo de respaldo '${BACKUP_FILE}' no existe."
    exit 1
fi

echo "[ADVERTENCIA] Se va a sobreescribir la base de datos '${DB_NAME}' con:"
echo "              ${BACKUP_FILE}"
read -r -p "¿Deseas continuar con la restauración? [s/N]: " CONFIRMATION

if [[ ! "${CONFIRMATION}" =~ ^[sS]$ ]]; then
    echo "[INFO] Operación cancelada por el usuario."
    exit 0
fi

if [ -n "${DB_HOST}" ] && [ "${DB_HOST}" != "localhost" ] && [ "${DB_HOST}" != "127.0.0.1" ]; then
    echo "[1/3] Descomprimiendo y restaurando en Cloud SQL (${DB_HOST})..."
    gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${DB_PASSWORD:-}" psql -h "${DB_HOST}" -p "${DB_PORT:-5432}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null

    echo "[2/3] Verificando integridad de tablas principales en Cloud SQL..."
    PGPASSWORD="${DB_PASSWORD:-}" psql -h "${DB_HOST}" -p "${DB_PORT:-5432}" -U "${DB_USER}" -d "${DB_NAME}" -c \
      "SELECT 'Patios' AS tabla, count(*) AS registros FROM patios
       UNION ALL
       SELECT 'Sepulturas', count(*) FROM sepulturas
       UNION ALL
       SELECT 'Mausoleos', count(*) FROM mausoleos_historicos
       UNION ALL
       SELECT 'Usuarios', count(*) FROM usuarios;"
else
    echo "[1/3] Descomprimiendo y restaurando en ${CONTAINER_NAME}..."
    gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" > /dev/null

    echo "[2/3] Verificando integridad de tablas principales en el clúster local..."
    docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c \
      "SELECT 'Patios' AS tabla, count(*) AS registros FROM patios
       UNION ALL
       SELECT 'Sepulturas', count(*) FROM sepulturas
       UNION ALL
       SELECT 'Mausoleos', count(*) FROM mausoleos_historicos
       UNION ALL
       SELECT 'Usuarios', count(*) FROM usuarios;"
fi

echo "================================================================="
echo " [OK] Restauración completada exitosamente."
echo "================================================================="
