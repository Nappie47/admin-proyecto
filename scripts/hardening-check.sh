#!/bin/bash
# ============================================================
# hardening-check.sh - Script de auditoría de hardening
# Ejecutar antes y después de aplicar medidas de seguridad
# ============================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
OUTPUT_DIR="${OUTPUT_DIR:-./docs/evidencia}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${OUTPUT_DIR}/hardening-report-${TIMESTAMP}.txt"
JSON_REPORT="${OUTPUT_DIR}/hardening-report-${TIMESTAMP}.json"

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Funciones de logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; ((FAILED++)); }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARNINGS++)); }

# Inicializar reporte JSON
init_json_report() {
    cat > "$JSON_REPORT" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "hostname": "$(hostname)",
  "checks": []
}
EOF
}

add_json_result() {
    local check_name="$1"
    local status="$2"  # PASS, FAIL, WARN
    local details="$3"
    local remediation="$4"

    jq --arg name "$check_name" \
       --arg status "$status" \
       --arg details "$details" \
       --arg remediation "$remediation" \
       '.checks += [{"name": $name, "status": $status, "details": $details, "remediation": $remediation}]' \
       "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
}

# ============================================================
# CHECKS DE HARDENING - SISTEMA OPERATIVO (Lynis-style)
# ============================================================

check_os_updates() {
    log_info "Verificando actualizaciones de seguridad del SO..."
    if command -v apt >/dev/null 2>&1; then
        local updates=$(apt list --upgradable 2>/dev/null | grep -c "security" || true)
        if [[ $updates -eq 0 ]]; then
            log_pass "No hay actualizaciones de seguridad pendientes"
            add_json_result "os_security_updates" "PASS" "No security updates pending" ""
        else
            log_fail "$updates actualizaciones de seguridad pendientes"
            add_json_result "os_security_updates" "FAIL" "$updates security updates pending" "Ejecutar: apt update && apt upgrade -y"
        fi
    elif command -v yum >/dev/null 2>&1; then
        local updates=$(yum check-update --security 2>/dev/null | grep -c "^[a-z]" || true)
        if [[ $updates -eq 0 ]]; then
            log_pass "No hay actualizaciones de seguridad pendientes"
            add_json_result "os_security_updates" "PASS" "No security updates pending" ""
        else
            log_fail "$updates actualizaciones de seguridad pendientes"
            add_json_result "os_security_updates" "FAIL" "$updates security updates pending" "Ejecutar: yum update --security -y"
        fi
    else
        log_warn "Gestor de paquetes no soportado para check automático"
        add_json_result "os_security_updates" "WARN" "Package manager not supported" "Verificar manualmente"
    fi
}

check_ssh_config() {
    log_info "Verificando configuración SSH..."
    local sshd_config="/etc/ssh/sshd_config"
    local issues=0

    if [[ ! -f "$sshd_config" ]]; then
        log_warn "Archivo sshd_config no encontrado"
        add_json_result "ssh_config" "WARN" "sshd_config not found" "Verificar ubicación"
        return
    fi

    # PermitRootLogin
    if grep -q "^PermitRootLogin yes" "$sshd_config"; then
        log_fail "PermitRootLogin está habilitado (yes)"
        add_json_result "ssh_permit_root_login" "FAIL" "PermitRootLogin is yes" "Cambiar a: PermitRootLogin no"
        ((issues++))
    elif grep -q "^PermitRootLogin no" "$sshd_config"; then
        log_pass "PermitRootLogin deshabilitado"
        add_json_result "ssh_permit_root_login" "PASS" "PermitRootLogin is no" ""
    else
        log_warn "PermitRootLogin no configurado explícitamente"
        add_json_result "ssh_permit_root_login" "WARN" "PermitRootLogin not explicitly set" "Agregar: PermitRootLogin no"
        ((issues++))
    fi

    # PasswordAuthentication
    if grep -q "^PasswordAuthentication yes" "$sshd_config"; then
        log_fail "PasswordAuthentication habilitado"
        add_json_result "ssh_password_auth" "FAIL" "PasswordAuthentication is yes" "Cambiar a: PasswordAuthentication no"
        ((issues++))
    elif grep -q "^PasswordAuthentication no" "$sshd_config"; then
        log_pass "PasswordAuthentication deshabilitado"
        add_json_result "ssh_password_auth" "PASS" "PasswordAuthentication is no" ""
    else
        log_warn "PasswordAuthentication no configurado explícitamente"
        add_json_result "ssh_password_auth" "WARN" "PasswordAuthentication not explicitly set" "Agregar: PasswordAuthentication no"
        ((issues++))
    fi

    # PubkeyAuthentication
    if grep -q "^PubkeyAuthentication yes" "$sshd_config"; then
        log_pass "PubkeyAuthentication habilitado"
        add_json_result "ssh_pubkey_auth" "PASS" "PubkeyAuthentication is yes" ""
    else
        log_fail "PubkeyAuthentication no habilitado"
        add_json_result "ssh_pubkey_auth" "FAIL" "PubkeyAuthentication not enabled" "Agregar: PubkeyAuthentication yes"
        ((issues++))
    fi

    # Port (opcional - cambiar puerto por defecto)
    local port=$(grep "^Port " "$sshd_config" | awk '{print $2}' | head -1)
    if [[ "$port" == "22" ]] || [[ -z "$port" ]]; then
        log_warn "SSH en puerto por defecto (22)"
        add_json_result "ssh_port" "WARN" "SSH on default port 22" "Considerar cambiar a puerto no estándar (ej. 2222)"
    else
        log_pass "SSH en puerto no estándar: $port"
        add_json_result "ssh_port" "PASS" "SSH on non-standard port: $port" ""
    fi

    # Protocol
    if grep -q "^Protocol 2" "$sshd_config"; then
        log_pass "SSH Protocol 2 configurado"
        add_json_result "ssh_protocol" "PASS" "Protocol 2 configured" ""
    else
        log_warn "Protocol no configurado explícitamente (debería ser 2)"
        add_json_result "ssh_protocol" "WARN" "Protocol not explicitly set to 2" "Agregar: Protocol 2"
        ((issues++))
    fi

    # MaxAuthTries
    local max_tries=$(grep "^MaxAuthTries " "$sshd_config" | awk '{print $2}' | head -1)
    if [[ -n "$max_tries" && "$max_tries" -le 3 ]]; then
        log_pass "MaxAuthTries configurado: $max_tries"
        add_json_result "ssh_max_auth_tries" "PASS" "MaxAuthTries: $max_tries" ""
    else
        log_warn "MaxAuthTries no configurado o > 3"
        add_json_result "ssh_max_auth_tries" "WARN" "MaxAuthTries not set or > 3" "Agregar: MaxAuthTries 3"
        ((issues++))
    fi

    # ClientAliveInterval/Count
    local alive_interval=$(grep "^ClientAliveInterval " "$sshd_config" | awk '{print $2}' | head -1)
    local alive_count=$(grep "^ClientAliveCountMax " "$sshd_config" | awk '{print $2}' | head -1)
    if [[ -n "$alive_interval" && -n "$alive_count" ]]; then
        log_pass "ClientAliveInterval: $alive_interval, ClientAliveCountMax: $alive_count"
        add_json_result "ssh_client_alive" "PASS" "Interval: $alive_interval, CountMax: $alive_count" ""
    else
        log_warn "ClientAliveInterval/CountMax no configurados"
        add_json_result "ssh_client_alive" "WARN" "ClientAlive settings not configured" "Agregar: ClientAliveInterval 300, ClientAliveCountMax 2"
        ((issues++))
    fi

    # AllowUsers/AllowGroups
    if grep -q "^AllowUsers " "$sshd_config" || grep -q "^AllowGroups " "$sshd_config"; then
        log_pass "AllowUsers/AllowGroups configurado"
        add_json_result "ssh_allow_users" "PASS" "AllowUsers/AllowGroups configured" ""
    else
        log_warn "AllowUsers/AllowGroups no configurado"
        add_json_result "ssh_allow_users" "WARN" "AllowUsers/AllowGroups not configured" "Restringir acceso a usuarios/grupos específicos"
        ((issues++))
    fi

    return $issues
}

check_fail2ban() {
    log_info "Verificando fail2ban..."
    if systemctl is-active --quiet fail2ban 2>/dev/null; then
        log_pass "fail2ban está activo"
        add_json_result "fail2ban_active" "PASS" "fail2ban service is active" ""

        # Verificar jails configurados
        local jails=$(fail2ban-client status 2>/dev/null | grep "Jail list" | cut -d: -f2 | tr ',' '\n' | wc -l)
        if [[ $jails -gt 0 ]]; then
            log_pass "fail2ban tiene $jails jails configurados"
            add_json_result "fail2ban_jails" "PASS" "$jails jails configured" ""
        else
            log_warn "fail2ban activo pero sin jails configurados"
            add_json_result "fail2ban_jails" "WARN" "No jails configured" "Configurar jail para sshd"
        fi
    else
        log_fail "fail2ban no está activo"
        add_json_result "fail2ban_active" "FAIL" "fail2ban service not active" "systemctl enable --now fail2ban"
    fi
}

check_automatic_updates() {
    log_info "Verificando actualizaciones automáticas..."
    if systemctl is-enabled --quiet unattended-upgrades 2>/dev/null || \
       systemctl is-enabled --quiet dnf-automatic 2>/dev/null || \
       systemctl is-enabled --quiet yum-cron 2>/dev/null; then
        log_pass "Actualizaciones automáticas configuradas"
        add_json_result "auto_updates" "PASS" "Automatic updates enabled" ""
    else
        log_fail "Actualizaciones automáticas NO configuradas"
        add_json_result "auto_updates" "FAIL" "Automatic updates not configured" "Instalar y habilitar unattended-upgrades (Debian/Ubuntu) o dnf-automatic (RHEL/Fedora)"
    fi
}

check_kernel_params() {
    log_info "Verificando parámetros de kernel (sysctl)..."
    local issues=0

    # net.ipv4.ip_forward
    local ip_forward=$(sysctl -n net.ipv4.ip_forward 2>/dev/null || echo "1")
    if [[ "$ip_forward" == "0" ]]; then
        log_pass "IP forwarding deshabilitado"
        add_json_result "kernel_ip_forward" "PASS" "IP forwarding disabled" ""
    else
        log_warn "IP forwarding habilitado (puede ser necesario para routing)"
        add_json_result "kernel_ip_forward" "WARN" "IP forwarding enabled" "Verificar si es necesario: net.ipv4.ip_forward=0"
    fi

    # net.ipv4.conf.all.send_redirects
    local send_redirects=$(sysctl -n net.ipv4.conf.all.send_redirects 2>/dev/null || echo "1")
    if [[ "$send_redirects" == "0" ]]; then
        log_pass "ICMP redirects deshabilitado"
        add_json_result "kernel_send_redirects" "PASS" "ICMP redirects disabled" ""
    else
        log_fail "ICMP redirects habilitado"
        add_json_result "kernel_send_redirects" "FAIL" "ICMP redirects enabled" "sysctl -w net.ipv4.conf.all.send_redirects=0"
        ((issues++))
    fi

    # net.ipv4.conf.all.accept_redirects
    local accept_redirects=$(sysctl -n net.ipv4.conf.all.accept_redirects 2>/dev/null || echo "1")
    if [[ "$accept_redirects" == "0" ]]; then
        log_pass "Accept redirects deshabilitado"
        add_json_result "kernel_accept_redirects" "PASS" "Accept redirects disabled" ""
    else
        log_fail "Accept redirects habilitado"
        add_json_result "kernel_accept_redirects" "FAIL" "Accept redirects enabled" "sysctl -w net.ipv4.conf.all.accept_redirects=0"
        ((issues++))
    fi

    # net.ipv4.conf.all.accept_source_route
    local accept_source_route=$(sysctl -n net.ipv4.conf.all.accept_source_route 2>/dev/null || echo "1")
    if [[ "$accept_source_route" == "0" ]]; then
        log_pass "Source routing deshabilitado"
        add_json_result "kernel_source_route" "PASS" "Source routing disabled" ""
    else
        log_fail "Source routing habilitado"
        add_json_result "kernel_source_route" "FAIL" "Source routing enabled" "sysctl -w net.ipv4.conf.all.accept_source_route=0"
        ((issues++))
    fi

    # net.ipv4.icmp_echo_ignore_broadcasts
    local icmp_broadcast=$(sysctl -n net.ipv4.icmp_echo_ignore_broadcasts 2>/dev/null || echo "0")
    if [[ "$icmp_broadcast" == "1" ]]; then
        log_pass "ICMP echo ignore broadcasts habilitado"
        add_json_result "kernel_icmp_broadcast" "PASS" "ICMP echo ignore broadcasts enabled" ""
    else
        log_warn "ICMP echo ignore broadcasts deshabilitado"
        add_json_result "kernel_icmp_broadcast" "WARN" "ICMP echo ignore broadcasts disabled" "sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1"
    fi

    # net.ipv4.icmp_ignore_bogus_error_responses
    local icmp_bogus=$(sysctl -n net.ipv4.icmp_ignore_bogus_error_responses 2>/dev/null || echo "0")
    if [[ "$icmp_bogus" == "1" ]]; then
        log_pass "ICMP bogus error responses ignorado"
        add_json_result "kernel_icmp_bogus" "PASS" "ICMP bogus error responses ignored" ""
    else
        log_warn "ICMP bogus error responses no ignorado"
        add_json_result "kernel_icmp_bogus" "WARN" "ICMP bogus error responses not ignored" "sysctl -w net.ipv4.icmp_ignore_bogus_error_responses=1"
    fi

    # net.ipv4.tcp_syncookies
    local syncookies=$(sysctl -n net.ipv4.tcp_syncookies 2>/dev/null || echo "0")
    if [[ "$syncookies" == "1" ]]; then
        log_pass "TCP SYN cookies habilitado"
        add_json_result "kernel_syncookies" "PASS" "TCP SYN cookies enabled" ""
    else
        log_fail "TCP SYN cookies deshabilitado"
        add_json_result "kernel_syncookies" "FAIL" "TCP SYN cookies disabled" "sysctl -w net.ipv4.tcp_syncookies=1"
        ((issues++))
    fi

    return $issues
}

check_file_permissions() {
    log_info "Verificando permisos de archivos críticos..."
    local issues=0

    # /etc/passwd
    local passwd_perms=$(stat -c "%a" /etc/passwd 2>/dev/null || echo "644")
    if [[ "$passwd_perms" == "644" ]]; then
        log_pass "/etc/passwd permisos correctos (644)"
        add_json_result "perm_passwd" "PASS" "Permissions: 644" ""
    else
        log_fail "/etc/passwd permisos incorrectos: $passwd_perms"
        add_json_result "perm_passwd" "FAIL" "Permissions: $passwd_perms" "chmod 644 /etc/passwd"
        ((issues++))
    fi

    # /etc/shadow
    local shadow_perms=$(stat -c "%a" /etc/shadow 2>/dev/null || echo "640")
    if [[ "$shadow_perms" == "640" || "$shadow_perms" == "600" ]]; then
        log_pass "/etc/shadow permisos correctos ($shadow_perms)"
        add_json_result "perm_shadow" "PASS" "Permissions: $shadow_perms" ""
    else
        log_fail "/etc/shadow permisos incorrectos: $shadow_perms"
        add_json_result "perm_shadow" "FAIL" "Permissions: $shadow_perms" "chmod 640 /etc/shadow && chown root:shadow /etc/shadow"
        ((issues++))
    fi

    # /etc/gshadow
    local gshadow_perms=$(stat -c "%a" /etc/gshadow 2>/dev/null || echo "640")
    if [[ "$gshadow_perms" == "640" || "$gshadow_perms" == "600" ]]; then
        log_pass "/etc/gshadow permisos correctos ($gshadow_perms)"
        add_json_result "perm_gshadow" "PASS" "Permissions: $gshadow_perms" ""
    else
        log_fail "/etc/gshadow permisos incorrectos: $gshadow_perms"
        add_json_result "perm_gshadow" "FAIL" "Permissions: $gshadow_perms" "chmod 640 /etc/gshadow && chown root:shadow /etc/gshadow"
        ((issues++))
    fi

    # /etc/ssh/sshd_config
    local sshd_perms=$(stat -c "%a" /etc/ssh/sshd_config 2>/dev/null || echo "644")
    if [[ "$sshd_perms" == "644" || "$sshd_perms" == "600" ]]; then
        log_pass "/etc/ssh/sshd_config permisos correctos ($sshd_perms)"
        add_json_result "perm_sshd_config" "PASS" "Permissions: $sshd_perms" ""
    else
        log_fail "/etc/ssh/sshd_config permisos incorrectos: $sshd_perms"
        add_json_result "perm_sshd_config" "FAIL" "Permissions: $sshd_perms" "chmod 644 /etc/ssh/sshd_config"
        ((issues++))
    fi

    return $issues
}

check_world_writable() {
    log_info "Buscando archivos world-writable..."
    local ww_files=$(find / -xdev -type f -perm -0002 2>/dev/null | grep -v "^/proc" | grep -v "^/sys" | grep -v "^/run" | grep -v "^/tmp" | head -20)
    if [[ -z "$ww_files" ]]; then
        log_pass "No hay archivos world-writable en directorios críticos"
        add_json_result "world_writable_files" "PASS" "No world-writable files in critical dirs" ""
    else
        local count=$(echo "$ww_files" | wc -l)
        log_fail "Se encontraron $count archivos world-writable"
        add_json_result "world_writable_files" "FAIL" "$count world-writable files found" "Revisar y corregir permisos: chmod o-w <archivo>"
        echo "$ww_files" | head -10
    fi
}

check_suid_sgid() {
    log_info "Verificando archivos SUID/SGID..."
    local suid_files=$(find / -xdev -type f \( -perm -4000 -o -perm -2000 \) 2>/dev/null | grep -v "^/proc" | grep -v "^/sys" | head -20)
    local count=$(echo "$suid_files" | wc -l)
    if [[ $count -le 20 ]]; then
        log_pass "Número razonable de archivos SUID/SGID: $count"
        add_json_result "suid_sgid_files" "PASS" "$count SUID/SGID files" ""
    else
        log_warn "Muchos archivos SUID/SGID: $count"
        add_json_result "suid_sgid_files" "WARN" "$count SUID/SGID files (high)" "Revisar lista y eliminar innecesarios"
    fi
}

check_docker_hardening() {
    log_info "Verificando hardening de Docker..."
    if ! command -v docker >/dev/null 2>&1; then
        log_warn "Docker no instalado"
        add_json_result "docker_installed" "WARN" "Docker not installed" ""
        return
    fi

    add_json_result "docker_installed" "PASS" "Docker installed" ""

    # Docker daemon config
    local daemon_json="/etc/docker/daemon.json"
    if [[ -f "$daemon_json" ]]; then
        log_pass "Docker daemon.json existe"
        add_json_result "docker_daemon_config" "PASS" "daemon.json exists" ""

        # Verificar configuraciones de seguridad
        if grep -q '"userns-remap"' "$daemon_json"; then
            log_pass "User namespace remapping configurado"
            add_json_result "docker_userns_remap" "PASS" "User namespace remapping enabled" ""
        else
            log_warn "User namespace remapping NO configurado"
            add_json_result "docker_userns_remap" "WARN" "User namespace remapping not configured" "Agregar: \"userns-remap\": \"default\""
        fi

        if grep -q '"live-restore"' "$daemon_json" && grep -q 'true' "$daemon_json"; then
            log_pass "Live restore habilitado"
            add_json_result "docker_live_restore" "PASS" "Live restore enabled" ""
        else
            log_warn "Live restore NO habilitado"
            add_json_result "docker_live_restore" "WARN" "Live restore not enabled" "Agregar: \"live-restore\": true"
        fi

        if grep -q '"no-new-privileges"' "$daemon_json" && grep -q 'true' "$daemon_json"; then
            log_pass "No-new-privileges por defecto"
            add_json_result "docker_no_new_privs" "PASS" "No-new-privileges default" ""
        else
            log_warn "No-new-privileges NO por defecto"
            add_json_result "docker_no_new_privs" "WARN" "No-new-privileges not default" "Agregar: \"no-new-privileges\": true"
        fi
    else
        log_warn "Docker daemon.json NO existe"
        add_json_result "docker_daemon_config" "WARN" "daemon.json not found" "Crear /etc/docker/daemon.json con configuraciones de seguridad"
    fi

    # Verificar que docker socket no está expuesto
    if ss -lnt | grep -q ":2375\|:2376"; then
        log_fail "Docker API expuesto en puerto TCP"
        add_json_result "docker_api_exposed" "FAIL" "Docker API exposed on TCP port" "Eliminar -H tcp://0.0.0.0:2375 de docker service"
    else
        log_pass "Docker API no expuesto en TCP"
        add_json_result "docker_api_exposed" "PASS" "Docker API not exposed on TCP" ""
    fi
}

check_auditd() {
    log_info "Verificando auditd..."
    if systemctl is-active --quiet auditd 2>/dev/null; then
        log_pass "auditd está activo"
        add_json_result "auditd_active" "PASS" "auditd service active" ""

        # Verificar reglas
        local rules_count=$(auditctl -l 2>/dev/null | wc -l)
        if [[ $rules_count -gt 0 ]]; then
            log_pass "auditd tiene $rules_count reglas configuradas"
            add_json_result "auditd_rules" "PASS" "$rules_count audit rules configured" ""
        else
            log_warn "auditd activo pero sin reglas"
            add_json_result "auditd_rules" "WARN" "No audit rules configured" "Configurar reglas en /etc/audit/rules.d/"
        fi
    else
        log_fail "auditd NO está activo"
        add_json_result "auditd_active" "FAIL" "auditd service not active" "systemctl enable --now auditd"
    fi
}

# ============================================================
# CHECKS DE CONTENEDORES
# ============================================================

check_container_runtime() {
    log_info "Verificando runtime de contenedores..."

    # Verificar si estamos en un contenedor
    if [[ -f /.dockerenv ]] || grep -q "docker\|containerd" /proc/1/cgroup 2>/dev/null; then
        log_info "Ejecutándose dentro de un contenedor"

        # Usuario no-root
        local uid=$(id -u)
        if [[ $uid -ne 0 ]]; then
            log_pass "Contenedor ejecutándose como non-root (UID: $uid)"
            add_json_result "container_non_root" "PASS" "Running as non-root (UID: $uid)" ""
        else
            log_fail "Contenedor ejecutándose como root"
            add_json_result "container_non_root" "FAIL" "Running as root" "Configurar USER en Dockerfile"
        fi

        # Read-only filesystem
        if mount | grep -q " / .*ro,"; then
            log_pass "Root filesystem es read-only"
            add_json_result "container_readonly_fs" "PASS" "Root filesystem is read-only" ""
        else
            log_warn "Root filesystem NO es read-only"
            add_json_result "container_readonly_fs" "WARN" "Root filesystem not read-only" "Agregar readOnlyRootFilesystem: true en Cloud Run / securityContext en K8s"
        fi

        # Capabilities
        local cap_eff=$(cat /proc/self/status | grep CapEff | awk '{print $2}')
        if [[ "$cap_eff" == "0000000000000000" ]]; then
            log_pass "Todas las capabilities dropeadas"
            add_json_result "container_capabilities" "PASS" "All capabilities dropped" ""
        else
            log_warn "Capabilities no completamente dropeadas: $cap_eff"
            add_json_result "container_capabilities" "WARN" "Capabilities not fully dropped: $cap_eff" "Agregar cap_drop: [ALL] en securityContext"
        fi

        # No new privileges
        local no_new_privs=$(cat /proc/self/status | grep NoNewPrivs | awk '{print $2}')
        if [[ "$no_new_privs" == "1" ]]; then
            log_pass "NoNewPrivs habilitado"
            add_json_result "container_no_new_privs" "PASS" "NoNewPrivs enabled" ""
        else
            log_warn "NoNewPrivs NO habilitado"
            add_json_result "container_no_new_privs" "WARN" "NoNewPrivs not enabled" "Agregar allowPrivilegeEscalation: false"
        fi

        # Usuario
        local user=$(id -un)
        if [[ "$user" != "root" ]]; then
            log_pass "Ejecutándose como usuario: $user"
            add_json_result "container_user" "PASS" "Running as user: $user" ""
        else
            log_fail "Ejecutándose como root"
            add_json_result "container_user" "FAIL" "Running as root" "Configurar USER en Dockerfile"
        fi
    else
        log_info "No ejecutándose en contenedor, saltando checks de contenedor"
        add_json_result "container_checks" "SKIP" "Not running in container" ""
    fi
}

# ============================================================
# GENERAR REPORTE FINAL
# ============================================================

generate_summary() {
    echo ""
    echo "========================================"
    echo "RESUMEN DE HARDENING CHECK"
    echo "========================================"
    echo -e "PASS:  ${GREEN}$PASSED${NC}"
    echo -e "FAIL:  ${RED}$FAILED${NC}"
    echo -e "WARN:  ${YELLOW}$WARNINGS${NC}"
    echo "========================================"

    # Agregar resumen al reporte de texto
    {
        echo ""
        echo "========================================"
        echo "RESUMEN"
        echo "========================================"
        echo "PASSED: $PASSED"
        echo "FAILED: $FAILED"
        echo "WARNINGS: $WARNINGS"
        echo "TOTAL: $((PASSED + FAILED + WARNINGS))"
    } >> "$REPORT_FILE"

    # Score de seguridad
    local total=$((PASSED + FAILED + WARNINGS))
    if [[ $total -gt 0 ]]; then
        local score=$(( (PASSED * 100) / total ))
        echo "Security Score: $score%"
        echo "Security Score: $score%" >> "$REPORT_FILE"

        if [[ $score -ge 90 ]]; then
            echo -e "Nivel de seguridad: ${GREEN}EXCELENTE${NC}"
        elif [[ $score -ge 70 ]]; then
            echo -e "Nivel de seguridad: ${YELLOW}BUENO${NC}"
        elif [[ $score -ge 50 ]]; then
            echo -e "Nivel de seguridad: ${YELLOW}REGULAR${NC}"
        else
            echo -e "Nivel de seguridad: ${RED}CRÍTICO${NC}"
        fi
    fi
}

# ============================================================
# MAIN
# ============================================================

main() {
    echo "========================================"
    echo "HARDENING SECURITY CHECK"
    echo "Unidad 3 - Administración de Redes"
    echo "Timestamp: $(date)"
    echo "========================================"

    # Crear directorio de salida
    mkdir -p "$OUTPUT_DIR/$(date +%Y%m%d)"

    # Inicializar reportes
    init_json_report
    echo "Hardening Security Check Report" > "$REPORT_FILE"
    echo "Generated: $(date)" >> "$REPORT_FILE"
    echo "Host: $(hostname)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Ejecutar checks
    check_os_updates
    check_ssh_config
    check_fail2ban
    check_automatic_updates
    check_kernel_params
    check_file_permissions
    check_world_writable
    check_suid_sgid
    check_docker_hardening
    check_auditd
    check_container_runtime

    # Generar resumen
    generate_summary

    echo ""
    echo "Reportes generados:"
    echo "  - Texto: $REPORT_FILE"
    echo "  - JSON:  $JSON_REPORT"
}

# Ejecutar si se llama directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi