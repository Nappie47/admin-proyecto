#!/usr/bin/env bash
# ==============================================================================
# Script de Respaldo Automatizado de Base de Datos PostgreSQL + PostGIS (HA)
# Proyecto: SIG Cementerio General de Los Ángeles (Unidad 2)
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/cementerio_db_${TIMESTAMP}.sql.gz"

if [ -f "${PROJECT_ROOT}/.env" ]; then
    # shellcheck disable=SC1091
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
fi

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-cementerio_db}"
CONTAINER_NAME="sig_db_primary"

echo "================================================================="
echo " [SIG CEMENTERIO] Iniciando Respaldo de Base de Datos (Primario)"
echo " Fecha/Hora: $(date)"
echo " Base de datos: ${DB_NAME} en contenedor: ${CONTAINER_NAME}"
echo "================================================================="

mkdir -p "${BACKUP_DIR}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[AVISO] El contenedor '${CONTAINER_NAME}' no está corriendo. Intentando con réplica..."
    CONTAINER_NAME="sig_db_replica"
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "[ERROR] Ni '${CONTAINER_NAME}' ni el nodo primario están disponibles."
        exit 1
    fi
fi

echo "[1/3] Extrayendo volcado de PostgreSQL desde ${CONTAINER_NAME}..."
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

if [ -s "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[2/3] Respaldo generado exitosamente:"
    echo "      Archivo: ${BACKUP_FILE}"
    echo "      Tamaño:  ${FILE_SIZE}"
else
    echo "[ERROR] El archivo de respaldo se creó vacío. Abortando."
    rm -f "${BACKUP_FILE}"
    exit 1
fi

echo "[3/3] Aplicando política de retención (conservar últimos 7 días)..."
find "${BACKUP_DIR}" -name "cementerio_db_*.sql.gz" -type f -mtime +7 -delete

echo "================================================================="
echo " [OK] Respaldo finalizado correctamente."
echo "================================================================="
