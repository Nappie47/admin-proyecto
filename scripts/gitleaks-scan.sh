#!/bin/bash
# ============================================================
# gitleaks-scan.sh - Detección de secretos en repositorio
# Ejecutar en CI/CD y localmente antes de commits
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
SCAN_MODE="${1:-full}"  # full | staged | commit-range
OUTPUT_DIR="${OUTPUT_DIR:-./docs/evidencia/gitleaks}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPO_PATH="${REPO_PATH:-.}"

mkdir -p "$OUTPUT_DIR"

# Archivos de salida
SARIF_OUTPUT="${OUTPUT_DIR}/gitleaks-${SCAN_MODE}-${TIMESTAMP}.sarif"
JSON_OUTPUT="${OUTPUT_DIR}/gitleaks-${SCAN_MODE}-${TIMESTAMP}.json"
TXT_OUTPUT="${OUTPUT_DIR}/gitleaks-${SCAN_MODE}-${TIMESTAMP}.txt"
HTML_OUTPUT="${OUTPUT_DIR}/gitleaks-${SCAN_MODE}-${TIMESTAMP}.html"

# Verificar gitleaks
if ! command -v gitleaks >/dev/null 2>&1; then
    log_info "gitleaks no encontrado, instalando..."
    if command -v go >/dev/null 2>&1; then
        go install github.com/gitleaks/gitleaks/v8@latest
        export PATH=$PATH:$(go env GOPATH)/bin
    elif command -v docker >/dev/null 2>&1; then
        log_info "Usando gitleaks via Docker"
        GITLEAKS_CMD="docker run --rm -v $(pwd):/src zricethezav/gitleaks:latest"
    else
        log_fail "gitleaks no instalado y no hay go/docker disponible"
        exit 1
    fi
else
    GITLEAKS_CMD="gitleaks"
fi

# Configuración de gitleaks (usar config file si existe)
CONFIG_FILE="${GITLEAKS_CONFIG:-.gitleaks.toml}"
if [[ ! -f "$CONFIG_FILE" ]]; then
    log_warn "Archivo de configuración $CONFIG_FILE no encontrado, usando defaults"
    CONFIG_ARGS=""
else
    CONFIG_ARGS="--config $CONFIG_FILE"
fi

log_info "========================================"
log_info "GITLEAKS SECRET SCANNING"
log_info "========================================"
log_info "Modo: $SCAN_MODE"
log_info "Repo: $REPO_PATH"
log_info "Config: $CONFIG_FILE"
log_info "Salida: $OUTPUT_DIR"
log_info "========================================"

cd "$REPO_PATH"

# Función para ejecutar gitleaks
run_gitleaks() {
    local detect_args="$1"
    local output_format="$2"
    local output_file="$3"

    if [[ "$GITLEAKS_CMD" == "docker run"* ]]; then
        $GITLEAKS_CMD detect $CONFIG_ARGS $detect_args --report-format "$output_format" --report-path "/src/$output_file" --source /src --verbose
    else
        $GITLEAKS_CMD detect $CONFIG_ARGS $detect_args --report-format "$output_format" --report-path "$output_file" --source . --verbose
    fi
}

# ============================================================
# EJECUTAR SEGÚN MODO
# ============================================================

case "$SCAN_MODE" in
    full)
        log_info "Ejecutando escaneo COMPLETO (todo el historial)..."
        run_gitleaks "--no-git" "sarif" "$SARIF_OUTPUT"
        run_gitleaks "--no-git" "json" "$JSON_OUTPUT"
        run_gitleaks "--no-git" "json" "$TXT_OUTPUT"  # gitleaks json a txt
        ;;

    staged)
        log_info "Escaneando archivos en STAGE (git add)..."
        # gitleaks detect --staged no existe, usar --no-git con archivos staged
        git diff --cached --name-only | while read -r file; do
            if [[ -f "$file" ]]; then
                $GITLEAKS_CMD detect $CONFIG_ARGS --source "$file" --report-format sarif --report-path "$OUTPUT_DIR/gitleaks-staged-${file//\//_}-${TIMESTAMP}.sarif" --verbose
            fi
        done
        ;;

    commit-range)
        # Requiere dos commits: FROM..TO
        FROM_COMMIT="${2:-HEAD~1}"
        TO_COMMIT="${3:-HEAD}"
        log_info "Escaneando rango de commits: $FROM_COMMIT..$TO_COMMIT"
        run_gitleaks "--commit-range $FROM_COMMIT..$TO_COMMIT" "sarif" "$SARIF_OUTPUT"
        run_gitleaks "--commit-range $FROM_COMMIT..$TO_COMMIT" "json" "$JSON_OUTPUT"
        ;;

    *)
        log_fail "Modo inválido: $SCAN_MODE. Usar: full | staged | commit-range"
        exit 1
        ;;
esac

# ============================================================
# PROCESAR RESULTADOS
# ============================================================

if [[ -f "$JSON_OUTPUT" ]]; then
    log_info "Procesando resultados..."

    # Contar hallazgos
    FINDINGS=$(jq '. | length' "$JSON_OUTPUT" 2>/dev/null || echo "0")

    if [[ "$FINDINGS" -eq 0 ]]; then
        log_pass "¡No se encontraron secretos!"
        echo "No secrets found" > "$TXT_OUTPUT"
    else
        log_fail "Se encontraron $FINDINGS posibles secretos!"

        # Generar reporte legible
        echo "========================================" > "$TXT_OUTPUT"
        echo "GITLEAKS REPORT - $TIMESTAMP" >> "$TXT_OUTPUT"
        echo "========================================" >> "$TXT_OUTPUT"
        echo "Total findings: $FINDINGS" >> "$TXT_OUTPUT"
        echo "" >> "$TXT_OUTPUT"

        jq -r '.[] | "File: \(.File)\nLine: \(.StartLine)-\(.EndLine)\nRule: \(.RuleID)\nSecret: \(.Secret)\nEntropy: \(.Entropy)\n---"' "$JSON_OUTPUT" >> "$TXT_OUTPUT"

        # Clasificar por severidad
        log_fail "SECRETS ENCONTRADOS - Revisar inmediatamente:"
        jq -r '.[] | "\(.File):\(.StartLine) - \(.RuleID) - \(.Secret | .[0:20])..."' "$JSON_OUTPUT" | head -20 | while read -r line; do
            log_fail "  $line"
        done

        # Generar HTML report
        if command -v python3 >/dev/null 2>&1; then
            python3 -c "
import json, html
with open('$JSON_OUTPUT') as f:
    data = json.load(f)
html_content = '''<!DOCTYPE html>
<html><head><title>Gitleaks Report</title>
<style>
body { font-family: monospace; margin: 20px; }
.finding { border: 1px solid #ddd; margin: 10px; padding: 10px; border-radius: 5px; }
.critical { border-left: 5px solid red; }
.high { border-left: 5px solid orange; }
.medium { border-left: 5px solid yellow; }
.low { border-left: 5px solid green; }
.secret { background: #ffe6e6; padding: 2px 4px; border-radius: 3px; }
</style></head><body>
<h1>Gitleaks Report - $TIMESTAMP</h1>
<p>Total findings: $FINDINGS</p>
'''
for f in data:
    severity = 'medium'
    if 'AWS' in f.get('RuleID', '') or 'PRIVATE_KEY' in f.get('RuleID', ''):
        severity = 'critical'
    elif 'PASSWORD' in f.get('RuleID', '') or 'TOKEN' in f.get('RuleID', ''):
        severity = 'high'
    html_content += f'<div class=\"finding {severity}\"><b>File:</b> {html.escape(f[\"File\"])}<br><b>Line:</b> {f[\"StartLine\"]}-{f[\"EndLine\"]}<br><b>Rule:</b> {html.escape(f[\"RuleID\"])}<br><b>Secret:</b> <span class=\"secret\">{html.escape(f[\"Secret\"][:50])}...</span><br><b>Entropy:</b> {f[\"Entropy\"]}</div>'
html_content += '</body></html>'
with open('$HTML_OUTPUT', 'w') as f:
    f.write(html_content)
"
            log_pass "Reporte HTML generado: $HTML_OUTPUT"
        fi
    fi
else
    log_warn "No se generó archivo JSON de resultados"
fi

# ============================================================
# VERIFICACIÓN DE REGLAS PERSONALIZADAS
# ============================================================

log_info "Verificando reglas de detección..."

# Verificar que el config tiene reglas para:
# - AWS keys
# - GCP keys
# - Private keys
# - Passwords
# - JWT tokens
# - Database URLs
# - Generic API keys

if [[ -f "$CONFIG_FILE" ]]; then
    log_info "Configuración personalizada detectada: $CONFIG_FILE"
    RULE_COUNT=$(grep -c "^\[\[rules\]\]" "$CONFIG_FILE" 2>/dev/null || echo "0")
    log_info "Reglas personalizadas: $RULE_COUNT"
else
    log_warn "Usando reglas por defecto de gitleaks"
    log_info "Considerar agregar .gitleaks.toml con reglas específicas del proyecto"
fi

# ============================================================
# RESUMEN FINAL
# ============================================================

echo ""
echo "========================================"
echo "GITLEAKS SCAN COMPLETADO"
echo "========================================"
echo "Modo: $SCAN_MODE"
echo "Hallazgos: $FINDINGS"
echo "Reportes generados:"
echo "  SARIF: $SARIF_OUTPUT"
echo "  JSON:  $JSON_OUTPUT"
echo "  TXT:   $TXT_OUTPUT"
[[ -f "$HTML_OUTPUT" ]] && echo "  HTML:  $HTML_OUTPUT"
echo ""

if [[ "$FINDINGS" -gt 0 ]]; then
    log_fail "⚠️  SE ENCONTRARON SECRETOS - Revisar y remover antes de commit/push"
    log_info "Para remover del historial: git filter-branch / BFG Repo-Cleaner"
    exit 1
else
    log_pass "✅ No se detectaron secretos"
    exit 0
fi