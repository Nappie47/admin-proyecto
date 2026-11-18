#!/bin/bash
# ==============================================================================
# setup-host-hardening.sh - Hardening de la Máquina Virtual EC2 (AWS)
# Unidad 3: Hardening, Criptografía y Seguridad Perimetral
# Autores: Bryan Ahumada & Johan Muñoz
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "Iniciando Hardening del Host EC2 en AWS (Ubuntu/Debian)..."
echo "=========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "Error: Este script debe ejecutarse como root (sudo bash setup-host-hardening.sh)"
  exit 1
fi

ADMIN_USER="${SUDO_USER:-ubuntu}"
ADMIN_IP="${1:-}"

# 1. ACTUALIZACIONES DE SEGURIDAD AUTOMÁTICAS
echo "[1/5] Configurando actualizaciones desatendidas (unattended-upgrades)..."
apt-get update -y
apt-get install -y unattended-upgrades fail2ban iptables-persistent curl
dpkg-reconfigure -f noninteractive unattended-upgrades

# 2. HARDENING DE SSH (/etc/ssh/sshd_config)
echo "[2/5] Endureciendo /etc/ssh/sshd_config..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak_$(date +%F_%T)

cat > /etc/ssh/sshd_config.d/99-hardened.conf <<EOF
# Hardening de SSH - Unidad 3 Administracion de Redes
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
X11Forwarding no
AllowTcpForwarding no
AllowUsers ${ADMIN_USER}
EOF

# Validar sintaxis y reiniciar servicio SSH
sshd -t
systemctl restart ssh || systemctl restart sshd
echo "-> SSH endurecido: Root deshabilitado, passwords deshabilitados, timeouts configurados."

# 3. PROTECCIÓN CONTRA FUERZA BRUTA CON FAIL2BAN
echo "[3/5] Configurando Fail2ban para SSH..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

systemctl enable --now fail2ban
fail2ban-client reload || systemctl restart fail2ban
echo "-> Fail2ban activo y vigilando intentos de fuerza bruta."

# 4. FIREWALL DE HOST Y CADENA DOCKER-USER EN IPTABLES
echo "[4/5] Configurando regla DOCKER-USER en iptables para control de contenedores..."
# Asegurar que la cadena DOCKER-USER existe
iptables -N DOCKER-USER 2>/dev/null || true

# Limpiar reglas previas en DOCKER-USER
iptables -F DOCKER-USER

# Si se proporciono IP del admin, permitir SSH solo a esa IP en DOCKER-USER y denegar el resto
if [ -n "$ADMIN_IP" ]; then
  iptables -A DOCKER-USER -i eth0 -s "${ADMIN_IP}" -p tcp --dport 22 -j ACCEPT
  iptables -A DOCKER-USER -i eth0 -p tcp --dport 22 -j DROP
  echo "-> Regla DOCKER-USER aplicada para restringir acceso exclusivo a IP: ${ADMIN_IP}"
fi

# Permitir trafico establecido y relacionado
iptables -A DOCKER-USER -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
# Retornar control al flujo estandar de Docker
iptables -A DOCKER-USER -j RETURN

# Guardar reglas persistentes
netfilter-persistent save 2>/dev/null || iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
echo "-> Cadena DOCKER-USER configurada exitosamente."

# 5. HARDENING DEL KERNEL (/etc/sysctl.d/99-security.conf)
echo "[5/5] Endureciendo parametros del kernel (sysctl)..."
cat > /etc/sysctl.d/99-security.conf <<EOF
# Proteccion contra IP Spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignorar peticiones ICMP broadcast (Smurf attacks)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Deshabilitar aceptacion de paquetes con Source Routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Mitigacion SYN Flood
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# Deshabilitar envio de redirecciones ICMP
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
EOF

sysctl -p /etc/sysctl.d/99-security.conf 2>/dev/null || true

echo "=========================================================="
echo "Hardening del Host completado exitosamente."
echo "Ejecute 'sudo lynis audit system --quick' para comprobar el incremento de puntaje."
echo "=========================================================="
