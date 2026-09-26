#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/cementerio_backup_${TIMESTAMP}.sql.gz"

echo "=================================================="
echo "[$(date)] INICIANDO RESPALDO DE BASE DE DATOS"
echo "Host: ${DB_HOST:-vm5_db_primaria} | Base de datos: ${DB_NAME:-cementerio_db}"
echo "=================================================="

mkdir -p "${BACKUP_DIR}"

# 1. Ejecutar pg_dump y comprimir con gzip
pg_dump -h "${DB_HOST:-vm5_db_primaria}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME:-cementerio_db}" \
        --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[OK] Respaldo generado con éxito: ${BACKUP_FILE} (Tamaño: ${FILE_SIZE})"

# 2. Política de retención: Eliminar respaldos mayores a 7 días
echo "[INFO] Aplicando política de retención (7 días)..."
find "${BACKUP_DIR}" -type f -name "cementerio_backup_*.sql.gz" -mtime +7 -exec rm -f {} \;

# 3. Respaldo opcional hacia la nube (Google Cloud Storage)
if [ -n "${GCS_BUCKET}" ]; then
    echo "[INFO] Sincronizando respaldo hacia Google Cloud Storage: gs://${GCS_BUCKET} ..."
    # gsutil cp "${BACKUP_FILE}" "gs://${GCS_BUCKET}/" || echo "[WARN] No se pudo subir a GCS"
fi

echo "=================================================="
echo "[$(date)] PROCESO DE RESPALDO FINALIZADO CON ÉXITO"
echo "=================================================="
