#!/bin/bash
# ============================================================
# nmap-scan.sh - Escaneo de puertos para evidencia antes/después
# Ejecutar ANTES y DESPUÉS de aplicar reglas de firewall
# ============================================================

set -euo pipefail

# Configuración
SCAN_TYPE="${1:-external}"  # external | internal
TARGET="${2:-}"
OUTPUT_DIR="${OUTPUT_DIR:-./docs/evidencia}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Validar target
if [[ -z "$TARGET" ]]; then
    echo "Uso: $0 <external|internal> <target_ip_or_domain>"
    echo "Ejemplo: $0 external 35.123.45.67"
    echo "Ejemplo: $0 internal 10.0.2.15"
    exit 1
fi

# Verificar nmap
if ! command -v nmap >/dev/null 2>&1; then
    echo "Error: nmap no instalado. Instalar: apt install nmap / yum install nmap"
    exit 1
fi

# Crear directorio de salida
mkdir -p "$OUTPUT_DIR/nmap"

# Archivos de salida
XML_OUTPUT="${OUTPUT_DIR}/nmap/nmap-${SCAN_TYPE}-${TARGET//./_}-${TIMESTAMP}.xml"
TXT_OUTPUT="${OUTPUT_DIR}/nmap/nmap-${SCAN_TYPE}-${TARGET//./_}-${TIMESTAMP}.txt"
JSON_OUTPUT="${OUTPUT_DIR}/nmap/nmap-${SCAN_TYPE}-${TARGET//./_}-${TIMESTAMP}.json"

log_info "Iniciando escaneo $SCAN_TYPE contra $TARGET"
log_info "Salida XML: $XML_OUTPUT"
log_info "Salida TXT: $TXT_OUTPUT"

# Función para escaneo externo
scan_external() {
    local target="$1"
    log_info "Ejecutando escaneo EXTERNO (desde Internet)..."

    # Escaneo SYN scan (requiere root) o connect scan
    if [[ $EUID -eq 0 ]]; then
        nmap -sS -T4 \
             -p 1-65535 \
             --open \
             --reason \
             --version-intensity 5 \
             -oX "$XML_OUTPUT" \
             -oN "$TXT_OUTPUT" \
             "$target"
    else
        nmap -sT -T4 \
             -p 1-65535 \
             --open \
             --reason \
             --version-intensity 5 \
             -oX "$XML_OUTPUT" \
             -oN "$TXT_OUTPUT" \
             "$target"
    fi

    # También escaneo UDP básico (puertos comunes)
    nmap -sU -T4 \
         --top-ports 100 \
         --open \
         -oX "${XML_OUTPUT%.xml}-udp.xml" \
         -oN "${TXT_OUTPUT%.txt}-udp.txt" \
         "$target" 2>/dev/null || log_warn "Escaneo UDP requiere root, saltando..."
}

# Función para escaneo interno
scan_internal() {
    local target="$1"
    log_info "Ejecutando escaneo INTERNO (desde dentro de VPC)..."

    # Escaneo TCP completo
    nmap -sT -T4 \
         -p 1-65535 \
         --open \
         --reason \
         --version-intensity 5 \
         -oX "$XML_OUTPUT" \
         -oN "$TXT_OUTPUT" \
         "$target"

    # Escaneo de scripts de vulnerabilidades básicas
    nmap -sT -T4 \
         -p 22,80,443,3306,5432,6379,8080,8443 \
         --script vuln \
         -oX "${XML_OUTPUT%.xml}-vuln.xml" \
         -oN "${TXT_OUTPUT%.txt}-vuln.txt" \
         "$target" 2>/dev/null || log_warn "Nmap scripts requieren permisos, saltando vuln scan..."
}

# Ejecutar escaneo según tipo
case "$SCAN_TYPE" in
    external)
        scan_external "$TARGET"
        ;;
    internal)
        scan_internal "$TARGET"
        ;;
    *)
        echo "Error: Tipo de escaneo debe ser 'external' o 'internal'"
        exit 1
        ;;
esac

# Verificar resultados
if [[ -f "$XML_OUTPUT" ]]; then
    # Convertir XML a JSON para análisis
    if command -v xml2json >/dev/null 2>&1; then
        xml2json "$XML_OUTPUT" > "${OUTPUT_DIR}/nmap/nmap-${SCAN_TYPE}-${TARGET//./_}-${TIMESTAMP}.json"
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "
import xml.etree.ElementTree as ET
import json
import sys

tree = ET.parse('$XML_OUTPUT')
root = tree.getroot()

result = {
    'scan_info': {},
    'hosts': []
}

for elem in root:
    if elem.tag.endswith('scaninfo'):
        result['scan_info'] = elem.attrib
    elif elem.tag.endswith('host'):
        host = {}
        for child in elem:
            if child.tag.endswith('status'):
                host['status'] = child.attrib.get('state')
            elif child.tag.endswith('address'):
                host['address'] = child.attrib.get('addr')
            elif child.tag.endswith('ports'):
                ports = []
                for port in child:
                    if port.tag.endswith('port'):
                        p = {
                            'protocol': port.attrib.get('protocol'),
                            'portid': port.attrib.get('portid')
                        }
                        for pchild in port:
                            if pchild.tag.endswith('state'):
                                p['state'] = pchild.attrib.get('state')
                            elif pchild.tag.endswith('service'):
                                p['service'] = pchild.attrib
                        ports.append(p)
                host['ports'] = ports
        result['hosts'].append(host)

with open('${OUTPUT_DIR}/nmap/nmap-${SCAN_TYPE}-${TARGET//./_}-${TIMESTAMP}.json', 'w') as f:
    json.dump(result, f, indent=2)
"
        log_info "JSON generado"
    fi

    # Resumen de puertos abiertos
    log_info "Resumen de puertos abiertos:"
    if [[ -f "$TXT_OUTPUT" ]]; then
        grep -E "^[0-9]+/(tcp|udp)" "$TXT_OUTPUT" | while read -r line; do
            log_pass "  $line"
        done

        # Contar puertos
        local open_tcp=$(grep -c "^[0-9]*/tcp" "$TXT_OUTPUT" 2>/dev/null || echo 0)
        local open_udp=$(grep -c "^[0-9]*/udp" "$TXT_OUTPUT" 2>/dev/null || echo 0)
        log_info "Total puertos TCP abiertos: $open_tcp"
        log_info "Total puertos UDP abiertos: $open_udp"

        # Verificar puertos esperados vs inesperados
        case "$SCAN_TYPE" in
            external)
                # Solo deberían estar 80, 443 (y tal vez 8080 para health checks)
                if grep -q "^80/tcp" "$TXT_OUTPUT"; then log_warn "Puerto 80 (HTTP) abierto - debería redirigir a 443"; fi
                if grep -q "^443/tcp" "$TXT_OUTPUT"; then log_pass "Puerto 443 (HTTPS) abierto"; fi
                if grep -q "^22/tcp" "$TXT_OUTPUT"; then log_fail "Puerto 22 (SSH) expuesto públicamente!"; fi
                if grep -q "^3306/tcp\|^5432/tcp\|^6379/tcp" "$TXT_OUTPUT"; then log_fail "Puertos de BD expuestos públicamente!"; fi
                ;;
            internal)
                # Deberían estar puertos internos pero NO expuestos externamente
                if grep -q "^22/tcp" "$TXT_OUTPUT"; then log_info "Puerto 22 (SSH) accesible internamente"; fi
                if grep -q "^5432/tcp" "$TXT_OUTPUT"; then log_pass "PostgreSQL accesible internamente"; fi
                if grep -q "^6379/tcp" "$TXT_OUTPUT"; then log_pass "Redis accesible internamente"; fi
                ;;
        esac
    fi

    log_info "Escaneo completado. Archivos generados:"
    echo "  XML:  $XML_OUTPUT"
    echo "  TXT:  $TXT_OUTPUT"
    echo "  JSON: ${OUTPUT_DIR}/nmap/nmap-${SCAN_TYPE}-${TARGET//./_}-${TIMESTAMP}.json"
fi