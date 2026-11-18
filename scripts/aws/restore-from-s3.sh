#!/bin/bash
# ==============================================================================
# restore-from-s3.sh - Demostración de restauración desde Amazon S3
# Unidad 3: Hardening, Criptografía y Seguridad Perimetral
# Autores: Bryan Ahumada & Johan Muñoz
# ==============================================================================

set -euo pipefail

BUCKET_NAME="${1:-${S3_BACKUP_BUCKET:-}}"
RESTORE_DIR="/tmp/cemetery_restore"

if [ -z "$BUCKET_NAME" ]; then
  echo "Uso: ./restore-from-s3.sh <NOMBRE_BUCKET_S3>"
  echo "Ejemplo: ./restore-from-s3.sh cementerio-backups-u3-production"
  exit 1
fi

mkdir -p "$RESTORE_DIR"

echo "=========================================================="
echo "Demostracion de Restauracion de Base de Datos desde S3"
echo "Bucket origen: s3://${BUCKET_NAME}/backups/"
echo "=========================================================="

# 1. Obtener el archivo de respaldo mas reciente desde S3
echo "[1/3] Identificando el respaldo mas reciente en S3..."
LATEST_BACKUP=$(aws s3 ls "s3://${BUCKET_NAME}/backups/" | sort | tail -n 1 | awk '{print $4}')

if [ -z "$LATEST_BACKUP" ]; then
  echo "Error: No se encontraron archivos de respaldo en s3://${BUCKET_NAME}/backups/"
  exit 1
fi

echo "-> Respaldo detectado: $LATEST_BACKUP"

# 2. Descargar respaldo desde S3
echo "[2/3] Descargando respaldo seguro desde Amazon S3..."
LOCAL_BACKUP_PATH="${RESTORE_DIR}/${LATEST_BACKUP}"
aws s3 cp "s3://${BUCKET_NAME}/backups/${LATEST_BACKUP}" "$LOCAL_BACKUP_PATH"

# 3. Restauracion en el contenedor PostgreSQL
echo "[3/3] Descomprimiendo y restaurando en el contenedor PostgreSQL..."
gunzip -c "$LOCAL_BACKUP_PATH" | docker exec -i cemetery_db_hardened psql -U cemetery_admin -d cementerio_db

# Verificacion de integridad y conteo de tablas
echo "-> Verificando tablas restauradas:"
docker exec -i cemetery_db_hardened psql -U cemetery_admin -d cementerio_db -c "
SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int as total_registros
FROM (
  SELECT table_name, query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('sepulturas', 'patios', 'mausoleos_historicos', 'usuarios')
) t;
"

rm -f "$LOCAL_BACKUP_PATH"
echo "=========================================================="
echo "Restauracion completada y verificada con exito."
echo "=========================================================="
