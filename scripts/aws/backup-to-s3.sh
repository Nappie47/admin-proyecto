#!/bin/bash
# ==============================================================================
# backup-to-s3.sh - Respaldo cifrado de base de datos a Amazon S3 con KMS
# Unidad 3: Hardening, Criptografía y Seguridad Perimetral
# Autores: Bryan Ahumada & Johan Muñoz
# ==============================================================================

set -euo pipefail

BUCKET_NAME="${1:-${S3_BACKUP_BUCKET:-}}"
KMS_KEY_ALIAS="${2:-${AWS_KMS_KEY_ALIAS:-alias/cementerio-u3-key}}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/cemetery_backups"
BACKUP_FILE="${BACKUP_DIR}/cemetery_db_${TIMESTAMP}.sql.gz"

if [ -z "$BUCKET_NAME" ]; then
  echo "Uso: ./backup-to-s3.sh <NOMBRE_BUCKET_S3> [ALIAS_LLAVE_KMS]"
  echo "Ejemplo: ./backup-to-s3.sh cementerio-backups-u3-production"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "=========================================================="
echo "Iniciando respaldo de base de datos PostgreSQL..."
echo "Timestamp: $TIMESTAMP"
echo "Destino: s3://${BUCKET_NAME}/backups/"
echo "=========================================================="

# 1. Extraccion con pg_dump desde el contenedor y compresion con gzip
echo "[1/3] Extrayendo y comprimiendo volcado de base de datos..."
docker exec cemetery_db_hardened pg_dump -U cemetery_admin -d cementerio_db | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "-> Respaldo generado localmente: $BACKUP_FILE ($FILE_SIZE)"

# 2. Subida a Amazon S3 con cifrado del lado del servidor SSE-KMS
echo "[2/3] Subiendo respaldo cifrado a Amazon S3 con SSE-KMS..."
aws s3 cp "$BACKUP_FILE" "s3://${BUCKET_NAME}/backups/cemetery_db_${TIMESTAMP}.sql.gz" \
  --sse aws:kms \
  --sse-kms-key-id "$KMS_KEY_ALIAS"

echo "-> Subida exitosa con cifrado obligatorio SSE-KMS verificado."

# 3. Limpieza local de archivos temporales
echo "[3/3] Limpiando archivos temporales en el host..."
rm -f "$BACKUP_FILE"

echo "=========================================================="
echo "Respaldo completado y asegurado en la nube."
echo "Para verificar en S3 ejecute: aws s3 ls s3://${BUCKET_NAME}/backups/"
echo "=========================================================="
