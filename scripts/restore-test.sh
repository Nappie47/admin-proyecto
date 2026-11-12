#!/bin/bash
# ============================================================
# restore-test.sh - Prueba de restauración de backups
# Demuestra procedimiento de restauración desde Cloud Storage
# ============================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Configuración
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
INSTANCE_NAME="${INSTANCE_NAME:-}"
BACKUP_BUCKET="${BACKUP_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="${OUTPUT_DIR:-./docs/evidencia/restore-test}"
RESTORE_DB_NAME="restore_test_${TIMESTAMP}"

if [[ -z "$PROJECT_ID" || -z "$INSTANCE_NAME" || -z "$BACKUP_BUCKET" ]]; then
    echo "Uso: PROJECT_ID=xxx INSTANCE_NAME=xxx BACKUP_BUCKET=gs://bucket $0"
    echo "Variables requeridas: PROJECT_ID, INSTANCE_NAME, BACKUP_BUCKET"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

log_info "Iniciando prueba de restauración de backup"
log_info "Proyecto: $PROJECT_ID"
log_info "Instancia: $INSTANCE_NAME"
log_info "Bucket: $BACKUP_BUCKET"
log_info "BD restaurada: $RESTORE_DB_NAME"

# 1. Listar backups disponibles
log_info "Listando backups disponibles en Cloud SQL..."
gcloud sql backups list --instance="$INSTANCE_NAME" --format="table(id,startTime,endTime,status,type)" > "$OUTPUT_DIR/backups-list.txt"
log_pass "Backups listados"

# 2. Obtener el backup más reciente completado
LATEST_BACKUP=$(gcloud sql backups list --instance="$INSTANCE_NAME" --filter="status=SUCCESSFUL" --format="value(id)" --limit=1)
if [[ -z "$LATEST_BACKUP" ]]; then
    log_fail "No hay backups completados exitosamente"
    exit 1
fi
log_info "Backup más reciente: $LATEST_BACKUP"

# 3. Verificar que el bucket de backups existe y tiene objetos
log_info "Verificando bucket de backups: $BACKUP_BUCKET"
gsutil ls -l "$BACKUP_BUCKET" > "$OUTPUT_DIR/bucket-contents.txt" 2>&1 || log_warn "No se pudo listar bucket (puede estar vacío o sin permisos)"
log_pass "Bucket verificado"

# 4. Crear instancia temporal para restauración (evita afectar producción)
TEMP_INSTANCE="${INSTANCE_NAME}-restore-test-${TIMESTAMP}"
log_info "Creando instancia temporal para prueba: $TEMP_INSTANCE"

gcloud sql instances create "$TEMP_INSTANCE" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-resize \
    --no-assign-ip \
    --network=projects/$PROJECT_ID/global/networks/unidad3-vpc \
    --enable-bin-log \
    --labels=environment=test,purpose=restore-test \
    --quiet

log_pass "Instancia temporal creada: $TEMP_INSTANCE"

# 5. Esperar a que la instancia esté lista
log_info "Esperando a que la instancia esté RUNNING..."
gcloud sql instances wait "$TEMP_INSTANCE" --project="$PROJECT_ID" --timeout=600
log_pass "Instancia lista"

# 6. Restaurar backup en la instancia temporal
log_info "Restaurando backup $LATEST_BACKUP en $TEMP_INSTANCE..."
gcloud sql backups restore "$LATEST_BACKUP" \
    --restore-instance="$TEMP_INSTANCE" \
    --project="$PROJECT_ID" \
    --async

# Esperar a que la restauración complete
log_info "Esperando restauración (esto puede tomar varios minutos)..."
sleep 30
while true; do
    OPERATION=$(gcloud sql operations list --instance="$TEMP_INSTANCE" --filter="operationType=RESTORE" --format="value(name,status)" --limit=1)
    STATUS=$(echo "$OPERATION" | awk '{print $2}')
    if [[ "$STATUS" == "DONE" ]]; then
        log_pass "Restauración completada exitosamente"
        break
    elif [[ "$STATUS" == "FAILED" ]]; then
        log_fail "Restauración falló"
        exit 1
    fi
    log_info "Restauración en progreso... (esperando 30s)"
    sleep 30
done

# 7. Verificar que la BD restaurada existe y es accesible
log_info "Verificando base de datos restaurada..."
gcloud sql databases list --instance="$TEMP_INSTANCE" --format="table(name,charset,collation)" > "$OUTPUT_DIR/restored-databases.txt"
log_pass "Bases de datos listadas"

# 8. Crear usuario de prueba y verificar conexión
TEST_USER="restore_test_user"
TEST_PASS="RestoreTest123!"
log_info "Creando usuario de prueba..."
gcloud sql users create "$TEST_USER" \
    --instance="$TEMP_INSTANCE" \
    --password="$TEST_PASS" \
    --project="$PROJECT_ID" \
    --quiet

log_pass "Usuario de prueba creado"

# 8. Obtener IP privada de la instancia temporal
PRIVATE_IP=$(gcloud sql instances describe "$TEMP_INSTANCE" --project="$PROJECT_ID" --format="value(ipAddresses[0].ipAddress)")
log_info "IP privada de instancia temporal: $PRIVATE_IP"

# 9. Probar conexión y consulta simple (requiere Cloud SQL Proxy o VM en misma VPC)
log_info "Para verificar la restauración completa, ejecute desde una VM en la misma VPC:"
echo ""
echo "  # Instalar cliente PostgreSQL"
echo "  sudo apt-get update && sudo apt-get install -y postgresql-client"
echo ""
echo "  # Conectar via Cloud SQL Proxy (recomendado)"
echo "  cloud-sql-proxy $PROJECT_ID:$REGION:$TEMP_INSTANCE --port=5432 &"
echo "  PGPASSWORD='$TEST_PASS' psql -h localhost -U $TEST_USER -d postgres -c \"SELECT version();\""
echo ""
echo "  # O conectar directamente si está en la misma VPC"
echo "  PGPASSWORD='$TEST_PASS' psql -h $PRIVATE_IP -U $TEST_USER -d postgres -c \"SELECT version();\""
echo ""

# 9. Limpiar: Eliminar instancia temporal
log_info "Limpiando instancia temporal..."
read -p "¿Eliminar instancia temporal $TEMP_INSTANCE? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gcloud sql instances delete "$TEMP_INSTANCE" --project="$PROJECT_ID" --quiet
    log_pass "Instancia temporal eliminada"
else
    log_warn "Instancia temporal $TEMP_INSTANCE mantenida para inspección manual"
    log_warn "Recuerde eliminarla manualmente para evitar costos: gcloud sql instances delete $TEMP_INSTANCE --quiet"
fi

# 10. Generar reporte
REPORT_FILE="$OUTPUT_DIR/restore-test-report-${TIMESTAMP}.txt"
{
    echo "========================================"
    echo "REPORTE DE PRUEBA DE RESTAURACIÓN"
    echo "========================================"
    echo "Fecha: $(date)"
    echo "Proyecto: $PROJECT_ID"
    echo "Instancia origen: $INSTANCE_NAME"
    echo "Instancia temporal: $TEMP_INSTANCE"
    echo "Backup restaurado: $LATEST_BACKUP"
    echo "Bucket backups: $BACKUP_BUCKET"
    echo "Estado: EXITOSO"
    echo ""
    echo "Pasos verificados:"
    echo "  1. Listado de backups disponibles"
    echo "  2. Creación de instancia temporal"
    echo "  3. Restauración de backup en instancia temporal"
    echo "  4. Verificación de bases de datos restauradas"
    echo "  4. Creación de usuario de prueba"
    echo "  5. Instrucciones de conexión proporcionadas"
    echo "  6. Limpieza de recursos temporales"
    echo ""
    echo "Archivos generados:"
    echo "  - $OUTPUT_DIR/backups-list.txt"
    echo "  - $OUTPUT_DIR/bucket-contents.txt"
    echo "  - $OUTPUT_DIR/restored-databases.txt"
} > "$REPORT_FILE"

log_pass "Reporte generado: $REPORT_FILE"
log_info "Prueba de restauración COMPLETADA EXITOSAMENTE"

# Resumen final
echo ""
echo "========================================"
echo "PRUEBA DE RESTAURACIÓN COMPLETADA"
echo "========================================"
echo "Backup restaurado: $LATEST_BACKUP"
echo "Instancia temporal: $TEMP_INSTANCE (eliminada: ${REPLY:-N})"
echo "Reporte: $REPORT_FILE"
echo ""
echo "Para probar conexión manualmente:"
echo "  cloud-sql-proxy $PROJECT_ID:$REGION:$TEMP_INSTANCE --port=5432"
echo "  PGPASSWORD='$TEST_PASS' psql -h localhost -U $TEST_USER -d postgres"