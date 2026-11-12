#!/bin/bash
# ============================================================
# testssl-check.sh - Verificación de configuración TLS/SSL
# Usa testssl.sh para auditar configuración TLS
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
TARGET="${1:-}"
OUTPUT_DIR="${OUTPUT_DIR:-./docs/evidencia/tls}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [[ -z "$TARGET" ]]; then
    echo "Uso: $0 <dominio_o_ip>"
    echo "Ejemplo: $0 api.midominio.com"
    echo "Ejemplo: $0 35.123.45.67"
    exit 1
fi

# Verificar testssl.sh
if ! command -v testssl.sh >/dev/null 2>&1; then
    log_info "testssl.sh no encontrado, instalando..."
    if [[ -d "/opt/testssl.sh" ]]; then
        export PATH="/opt/testssl.sh:$PATH"
    else
        git clone --depth 1 https://github.com/drwetter/testssl.sh.git /opt/testssl.sh
        export PATH="/opt/testssl.sh:$PATH"
    fi
fi

mkdir -p "$OUTPUT_DIR"

# Archivos de salida
JSON_OUTPUT="${OUTPUT_DIR}/testssl-${TARGET//./_}-${TIMESTAMP}.json"
TXT_OUTPUT="${OUTPUT_DIR}/testssl-${TARGET//./_}-${TIMESTAMP}.txt"
HTML_OUTPUT="${OUTPUT_DIR}/testssl-${TARGET//./_}-${TIMESTAMP}.html"
CSV_OUTPUT="${OUTPUT_DIR}/testssl-${TARGET//./_}-${TIMESTAMP}.csv"

log_info "Iniciando testssl.sh contra $TARGET"
log_info "Salida JSON: $JSON_OUTPUT"
log_info "Salida HTML: $HTML_OUTPUT"

# Ejecutar testssl.sh con configuración completa
testssl.sh \
    --jsonfile "$JSON_OUTPUT" \
    --htmlfile "$HTML_OUTPUT" \
    --csvfile "$CSV_OUTPUT" \
    --logfile "$TXT_OUTPUT" \
    --color 0 \
    --quiet \
    --fast \
    --parallel \
    --severity HIGH \
    --severity MEDIUM \
    --severity LOW \
    --openssl-timeout 10 \
    --connect-timeout 10 \
    --max-time 30 \
    "$TARGET"

# Verificar resultados
if [[ -f "$JSON_OUTPUT" ]]; then
    log_info "Resultados guardados en $JSON_OUTPUT"

    # Parsear resultados clave con jq
    if command -v jq >/dev/null 2>&1; then
        log_info "Analizando resultados..."

        # Protocolos soportados
        local sslv2=$(jq -r '.scanResult[0].sslv2 // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null || echo "ERROR")
        local sslv3=$(jq -r '.scanResult[0].sslv3 // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null || echo "ERROR")
        local tlsv1=$(jq -r '.scanResult[0].tlsv1 // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null || echo "ERROR")
        local tlsv11=$(jq -r '.scanResult[0].tlsv11 // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null || echo "ERROR")
        local tlsv12=$(jq -r '.scanResult[0].tlsv12 // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null || echo "ERROR")
        local tlsv13=$(jq -r '.scanResult[0].tlsv13 // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null || echo "ERROR")

        echo ""
        echo "========================================"
        echo "PROTOCOLOS TLS/SSL"
        echo "========================================"

        # SSLv2
        if [[ "$sslv2" == "NOT OFFERED" ]] || [[ "$sslv2" == "FALSE" ]]; then
            log_pass "SSLv2: NO OFRECIDO (correcto)"
        else
            log_fail "SSLv2: OFRECIDO (INSEGURO)"
        fi

        # SSLv3
        if [[ "$sslv3" == "NOT OFFERED" ]] || [[ "$sslv3" == "FALSE" ]]; then
            log_pass "SSLv3: NO OFRECIDO (correcto)"
        else
            log_fail "SSLv3: OFRECIDO (INSEGURO - POODLE)"
        fi

        # TLS 1.0
        if [[ "$tlsv1" == "NOT OFFERED" ]] || [[ "$tlsv1" == "FALSE" ]]; then
            log_pass "TLS 1.0: NO OFRECIDO (correcto)"
        else
            log_warn "TLS 1.0: OFRECIDO (deprecated, debería deshabilitarse)"
        fi

        # TLS 1.1
        if [[ "$tlsv11" == "NOT OFFERED" ]] || [[ "$tlsv11" == "FALSE" ]]; then
            log_pass "TLS 1.1: NO OFRECIDO (correcto)"
        else
            log_warn "TLS 1.1: OFRECIDO (deprecated, debería deshabilitarse)"
        fi

        # TLS 1.2
        if [[ "$tlsv12" == "OFFERED" ]] || [[ "$tlsv12" == "TRUE" ]]; then
            log_pass "TLS 1.2: OFRECIDO (correcto)"
        else
            log_fail "TLS 1.2: NO OFRECIDO (REQUERIDO)"
        fi

        # TLS 1.3
        if [[ "$tlsv13" == "OFFERED" ]] || [[ "$tlsv13" == "TRUE" ]]; then
            log_pass "TLS 1.3: OFRECIDO (correcto - RECOMENDADO)"
        else
            log_warn "TLS 1.3: NO OFRECIDO (recomendado habilitar)"
        fi

        # Cipher suites
        echo ""
        echo "========================================"
        echo "CIPHER SUITES"
        echo "========================================"

        local ciphers=$(jq -r '.scanResult[0].cipherSuite[]? | "\(.name) \(.protocol) \(.keyExchange) \(.encryption) \(.mac)"' "$JSON_OUTPUT" 2>/dev/null | head -20)
        if [[ -n "$ciphers" ]]; then
            echo "$ciphers" | while read -r cipher; do
                # Verificar forward secrecy
                if echo "$cipher" | grep -qE "(ECDHE|DHE)"; then
                    log_pass "  $cipher (Forward Secrecy)"
                else
                    log_warn "  $cipher (NO Forward Secrecy)"
                fi
            done
        fi

        # Certificado
        echo ""
        echo "========================================"
        echo "CERTIFICADO"
        echo "========================================"

        local cert_subject=$(jq -r '.scanResult[0].certificates[0].subject // "N/A"' "$JSON_OUTPUT" 2>/dev/null)
        local cert_issuer=$(jq -r '.scanResult[0].certificates[0].issuer // "N/A"' "$JSON_OUTPUT" 2>/dev/null)
        local cert_not_after=$(jq -r '.scanResult[0].certificates[0].notAfter // "N/A"' "$JSON_OUTPUT" 2>/dev/null)
        local cert_sig_alg=$(jq -r '.scanResult[0].certificates[0].sigAlg // "N/A"' "$JSON_OUTPUT" 2>/dev/null)
        local cert_key_size=$(jq -r '.scanResult[0].certificates[0].keySize // "N/A"' "$JSON_OUTPUT" 2>/dev/null)

        echo "Subject: $cert_subject"
        echo "Issuer:  $cert_issuer"
        echo "Expira:  $cert_not_after"
        echo "Sig Alg: $cert_sig_alg"
        echo "Key Size: $cert_key_size bits"

        # Verificar expiración
        if [[ "$cert_not_after" != "N/A" ]]; then
            local expiry_epoch=$(date -d "$cert_not_after" +%s 2>/dev/null || echo 0)
            local now_epoch=$(date +%s)
            local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

            if [[ $days_left -lt 0 ]]; then
                log_fail "Certificado EXPIRADO hace $((days_left * -1)) días"
            elif [[ $days_left -lt 30 ]]; then
                log_fail "Certificado expira en $days_left días (URGENTE)"
            elif [[ $days_left -lt 60 ]]; then
                log_warn "Certificado expira en $days_left días (próximo a vencer)"
            else
                log_pass "Certificado válido por $days_left días"
            fi
        fi

        # Verificar algoritmo de firma
        if echo "$cert_sig_alg" | grep -qi "sha256\|sha384\|sha512"; then
            log_pass "Algoritmo de firma seguro: $cert_sig_alg"
        elif echo "$cert_sig_alg" | grep -qi "sha1\|md5"; then
            log_fail "Algoritmo de firma INSEGURO: $cert_sig_alg"
        fi

        # Verificar tamaño de clave
        if [[ "$cert_key_size" != "N/A" && "$cert_key_size" -ge 2048 ]]; then
            log_pass "Tamaño de clave adecuado: $cert_key_size bits"
        elif [[ "$cert_key_size" != "N/A" ]]; then
            log_fail "Tamaño de clave INSUFICIENTE: $cert_key_size bits (mínimo 2048)"
        fi

        # Vulnerabilidades conocidas
        echo ""
        echo "========================================"
        echo "VULNERABILIDADES CONOCIDAS"
        echo "========================================"

        local heartbleed=$(jq -r '.scanResult[0].vulnerabilities.heartbleed // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)
        local poodle=$(jq -r '.scanResult[0].vulnerabilities.poodle // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)
        local beast=$(jq -r '.scanResult[0].vulnerabilities.beast // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)
        local crime=$(jq -r '.scanResult[0].vulnerabilities.crime // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)
        local freak=$(jq -r '.scanResult[0].vulnerabilities.freak // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)
        local logjam=$(jq -r '.scanResult[0].vulnerabilities.logjam // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)

        for vuln_name in "heartbleed" "poodle" "beast" "crime" "freak" "logjam"; do
            local vuln_result=$(jq -r ".scanResult[0].vulnerabilities.$vuln_name // \"NOT TESTED\"" "$JSON_OUTPUT" 2>/dev/null)
            if [[ "$vuln_result" == "NOT VULNERABLE" ]] || [[ "$vuln_result" == "FALSE" ]] || [[ "$vuln_result" == "NOT VULNERABLE (OK)" ]]; then
                log_pass "${vuln_name^^}: No vulnerable"
            elif [[ "$vuln_result" == "VULNERABLE" ]] || [[ "$vuln_result" == "TRUE" ]] || [[ "$vuln_result" == "VULNERABLE (CRITICAL)" ]]; then
                log_fail "${vuln_name^^}: VULNERABLE!"
            else
                log_warn "${vuln_name^^}: $vuln_result"
            fi
        done

        # HSTS
        local hsts=$(jq -r '.scanResult[0].hsts // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)
        if [[ "$hsts" != "NOT TESTED" && "$hsts" != "N/A" ]]; then
            log_pass "HSTS configurado: $hsts"
        else
            log_warn "HSTS no configurado (recomendado para producción)"
        fi

        # OCSP Stapling
        local ocsp=$(jq -r '.scanResult[0].ocspStapling // "NOT TESTED"' "$JSON_OUTPUT" 2>/dev/null)
        if [[ "$ocsp" == "OFFERED" ]] || [[ "$ocsp" == "TRUE" ]]; then
            log_pass "OCSP Stapling habilitado"
        else
            log_warn "OCSP Stapling no habilitado (recomendado)"
        fi

        # Resumen final
        echo ""
        echo "========================================"
        echo "RESUMEN TLS/SSL PARA: $TARGET"
        echo "========================================"
        echo "Archivos generados:"
        echo "  JSON: $JSON_OUTPUT"
        echo "  HTML: $HTML_OUTPUT"
        echo "  CSV:  $CSV_OUTPUT"
        echo "  TXT:  $TXT_OUTPUT"
    else
        log_fail "No se pudo generar el reporte JSON"
        exit 1
    fi
}

# ============================================================
# MAIN
# ============================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Uso: $0 <dominio_o_ip[:puerto]>"
        echo "Ejemplo: $0 api.midominio.com"
        echo "Ejemplo: $0 35.123.45.67:443"
        exit 1
    fi

    main "$@"
fi