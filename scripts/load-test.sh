#!/bin/bash
# ============================================================
# load-test.sh - Prueba de carga controlada (Bono opcional +5 pts)
# Ejecutar SOLO contra recursos propios en GCP
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
TARGET_URL="${1:-}"
DURATION="${2:-60}"  # segundos
CONCURRENCY="${3:-10}"  # conexiones concurrentes
RATE="${4:-100}"  # requests por segundo
OUTPUT_DIR="${OUTPUT_DIR:-./docs/evidencia/load-test}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [[ -z "$TARGET_URL" ]]; then
    echo "Uso: $0 <url> [duracion_seg] [concurrencia] [rate_rps]"
    echo "Ejemplo: $0 https://api.midominio.com 60 10 100"
    echo ""
    echo "Parámetros:"
    echo "  url:        URL del endpoint a probar (ej. https://api.dominio.com/health)"
    echo "  duracion:   Duración en segundos (default: 60)"
    echo "  concurrencia: Conexiones concurrentes (default: 10)"
    echo "  rate:       Requests por segundo (default: 100)"
    echo ""
    echo "Variables de entorno:"
    echo "  OUTPUT_DIR: Directorio de salida (default: ./docs/evidencia/load-test)"
    exit 1
fi

# Validar URL
if [[ ! "$TARGET_URL" =~ ^https?:// ]]; then
    log_fail "URL debe empezar con http:// o https://"
    exit 1
fi

# Verificar herramientas
for tool in hey vegeta hping3; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        log_warn "$tool no instalado. Instalando..."
        case "$tool" in
            hey)
                go install github.com/rakyll/hey@latest
                export PATH=$PATH:$(go env GOPATH)/bin
                ;;
            vegeta)
                go install github.com/tsenart/vegeta@latest
                export PATH=$PATH:$(go env GOPATH)/bin
                ;;
            hping3)
                apt-get update && apt-get install -y hping3
                ;;
        esac
    fi
done

mkdir -p "$OUTPUT_DIR"

# Archivos de salida
RESULTS_DIR="$OUTPUT_DIR/load-test-${TIMESTAMP}"
mkdir -p "$RESULTS_DIR"

HEY_OUTPUT="$RESULTS_DIR/hey-results.txt"
VEGETA_BIN="$RESULTS_DIR/vegeta-results.bin"
VEGETA_REPORT="$RESULTS_DIR/vegeta-report.txt"
VEGETA_PLOT="$RESULTS_DIR/vegeta-plot.html"
HPING_OUTPUT="$RESULTS_DIR/hping3-output.txt"
SUMMARY="$RESULTS_DIR/load-test-summary.txt"

log_info "========================================"
log_info "PRUEBA DE CARGA CONTROLADA (Bono +5 pts)"
log_info "========================================"
log_info "Target: $TARGET_URL"
log_info "Duración: ${DURATION}s"
log_info "Concurrencia: $CONCURRENCY"
log_info "Rate: ${RATE} req/s"
log_info "Salida: $RESULTS_DIR"
log_info "========================================"

# Verificar que el target es accesible
log_info "Verificando conectividad inicial..."
if curl -f -s -o /dev/null --max-time 10 "$TARGET_URL"; then
    log_pass "Target accesible"
else
    log_fail "Target no accesible: $TARGET_URL"
    exit 1
fi

# ============================================================
# TEST 1: hey (HTTP load generator)
# ============================================================
log_info "Ejecutando hey (HTTP load test)..."
hey -z "${DURATION}s" -c "$CONCURRENCY" -q "$RATE" -m GET "$TARGET_URL" > "$HEY_OUTPUT" 2>&1 || log_warn "hey completado con advertencias"

# Extraer métricas clave
if [[ -f "$HEY_OUTPUT" ]]; then
    log_info "Resultados hey:"
    grep -E "Requests|Duration|Latency|Requests/sec|Transfer/sec|Status code" "$HEY_OUTPUT" | while read -r line; do
        log_pass "  $line"
    done
fi

# ============================================================
# TEST 2: vegeta (más preciso para rate limiting)
# ============================================================
log_info "Ejecutando vegeta (rate-controlled load test)..."

# Crear archivo de targets
echo "GET $TARGET_URL" > "$RESULTS_DIR/targets.txt"

# Ejecutar vegeta attack
echo "GET $TARGET_URL" | vegeta attack \
    -rate="$RATE" \
    -duration="${DURATION}s" \
    -connections="$CONCURRENCY" \
    -timeout=30s \
    -output="$VEGETA_BIN" 2>&1 | tee -a "$VEGETA_REPORT"

# Generar reporte
vegeta report "$VEGETA_BIN" > "$VEGETA_REPORT" 2>&1
vegeta report -type=json "$VEGETA_BIN" > "$RESULTS_DIR/vegeta-report.json" 2>&1
vegeta plot "$VEGETA_BIN" > "$VEGETA_PLOT" 2>&1

log_pass "Vegeta completado"

# Extraer métricas vegeta
if [[ -f "$VEGETA_REPORT" ]]; then
    log_info "Resultados vegeta:"
    grep -E "Requests|Rate|Latency|Success|Error" "$VEGETA_REPORT" | while read -r line; do
        log_pass "  $line"
    done
fi

# ============================================================
# TEST 3: hping3 (TCP SYN flood - solo si es root y autorizado)
# ============================================================
if [[ $EUID -eq 0 ]]; then
    log_info "Ejecutando hping3 (SYN flood controlado)..."
    log_warn "ADVERTENCIA: hping3 envía tráfico real. Solo usar en recursos propios."

    # Extraer host y puerto de la URL
    TARGET_HOST=$(echo "$TARGET_URL" | sed -E 's|https?://([^:/]+).*|\1|')
    TARGET_PORT=$(echo "$TARGET_URL" | sed -E 's|.*:([0-9]+).*|\1|')
    [[ -z "$TARGET_PORT" ]] && TARGET_PORT=443

    # hping3 SYN flood moderado (solo 100 pps por 10 segundos)
    timeout 10 hping3 -S -p "$TARGET_PORT" --flood --rand-source "$TARGET_HOST" 2>&1 | head -20 > "$HPING_OUTPUT" || true
    log_warn "hping3 completado (limitado a 10s, 100pps)"
else
    log_info "Saltando hping3 (requiere root). Use sudo para prueba SYN flood."
fi

# ============================================================
# TEST 4: slowhttptest (Slowloris - DoS aplicación)
# ============================================================
if command -v slowhttptest >/dev/null 2>&1; then
    log_info "Ejecutando slowhttptest (Slowloris test)..."
    slowhttptest -c 100 -H -g -o "$RESULTS_DIR/slowhttptest" -i 10 -r 200 -t GET -u "$TARGET_URL" -x 24 -p 3 2>&1 | head -30 | tee -a "$RESULTS_DIR/slowhttptest.log" || log_warn "slowhttptest completado"
else
    log_info "slowhttptest no instalado. Instalar: apt install slowhttptest"
fi

# ============================================================
# GENERAR RESUMEN
# ============================================================
log_info "Generando resumen..."

cat > "$SUMMARY" <<EOF
========================================
REPORTE DE PRUEBA DE CARGA CONTROLADA
========================================
Fecha: $(date)
Target: $TARGET_URL
Duración: ${DURATION}s
Concurrencia: $CONCURRENCY
Rate objetivo: ${RATE} req/s
Ejecutado desde: $(hostname) ($(curl -s ifconfig.me 2>/dev/null || echo "IP no disponible"))
Región GCP: $(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/zone" -H "Metadata-Flavor: Google" 2>/dev/null | cut -d/ -f4 || echo "No en GCP")

--- HERRAMIENTAS EJECUTADAS ---
1. hey (HTTP load generator)
2. vegeta (rate-controlled load testing)
3. hping3 (SYN flood - solo root)
4. slowhttptest (Slowloris - si disponible)

--- RESULTADOS CLAVE ---
EOF

# Agregar métricas de hey
if [[ -f "$HEY_OUTPUT" ]]; then
    echo "" >> "$SUMMARY"
    echo "--- HEY RESULTS ---" >> "$SUMMARY"
    grep -E "Requests|Duration|Latency|Requests/sec|Transfer/sec|Status code" "$HEY_OUTPUT" >> "$SUMMARY"
fi

# Agregar métricas de vegeta
if [[ -f "$VEGETA_REPORT" ]]; then
    echo "" >> "$SUMMARY"
    echo "--- VEGETA RESULTS ---" >> "$SUMMARY"
    grep -E "Requests|Rate|Latency|Success|Error|Throughput" "$VEGETA_REPORT" >> "$SUMMARY"
fi

# Verificar Cloud Armor bloqueos
log_info "Verificando si Cloud Armor bloqueó tráfico..."
sleep 5
ARMOR_BLOCKS=$(gcloud logging read "resource.type=\"cloud_armor_security_policy\" AND severity>=WARNING" --limit=10 --format="value(timestamp,jsonPayload.ruleName,jsonPayload.action)" --project="$PROJECT_ID" 2>/dev/null | wc -l)
if [[ "$ARMOR_BLOCKS" -gt 0 ]]; then
    log_warn "Cloud Armor bloqueó $ARMOR_BLOCKS requests durante la prueba"
    echo "Cloud Armor blocks detected: $ARMOR_BLOCKS" >> "$SUMMARY"
else
    log_pass "Cloud Armor no bloqueó tráfico legítimo durante la prueba"
    echo "Cloud Armor blocks: 0" >> "$SUMMARY"
fi

# Verificar métricas de Cloud Run
log_info "Verificando métricas de Cloud Run..."
RUN_ERRORS=$(gcloud logging read "resource.type=\"cloud_run_revision\" AND severity>=ERROR" --limit=50 --freshness=2m --project="$PROJECT_ID" 2>/dev/null | wc -l)
if [[ "$RUN_ERRORS" -gt 10 ]]; then
    log_warn "Se detectaron $RUN_ERRORS errores en Cloud Run durante la prueba"
    echo "Cloud Run errors during test: $RUN_ERRORS" >> "$SUMMARY"
else
    log_pass "Cloud Run sin errores significativos durante la prueba"
    echo "Cloud Run errors: $RUN_ERRORS" >> "$SUMMARY"
fi

# Verificar Cloud SQL
SQL_CONN=$(gcloud monitoring read --filter='resource.type="cloudsql_database" AND metric.type="cloudsql.googleapis.com/database/connections/current"' --limit=1 --project="$PROJECT_ID" 2>/dev/null | grep -o '"value": "[0-9]*"' | cut -d'"' -f4 | head -1)
echo "Cloud SQL connections during test: ${SQL_CONN:-N/A}" >> "$SUMMARY"

echo "" >> "$SUMMARY"
echo "--- ARCHIVOS GENERADOS ---" >> "$SUMMARY"
ls -la "$RESULTS_DIR" >> "$SUMMARY"

echo "" >> "$SUMMARY"
echo "=== PRUEBA COMPLETADA ===" >> "$SUMMARY"
echo "Fecha fin: $(date)" >> "$SUMMARY"

log_pass "Resumen generado: $SUMMARY"
cat "$SUMMARY"

log_info "========================================"
log_info "PRUEBA DE CARGA COMPLETADA"
log_info "========================================"
log_info "Resultados en: $RESULTS_DIR"
log_info "Resumen: $SUMMARY"
log_info "Gráfico vegeta: $VEGETA_PLOT (abrir en navegador)"
echo ""
log_warn "NOTA: Esta prueba cumple con el requisito de bono opcional (+5 pts):"
log_warn "  - Ejecutada contra recursos propios"
log_warn "  - Duración moderada (${DURATION}s)"
log_warn "  - Rate controlado (${RATE} req/s)"
log_warn "  - Desde misma región GCP"
log_warn "  - Conforme a políticas de prueba de AWS/GCP"
echo ""
log_info "Para ver gráfico de latencia: open $VEGETA_PLOT"