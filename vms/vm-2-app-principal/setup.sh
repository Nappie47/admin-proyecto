#!/bin/bash
# ==============================================================================
# SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN: VM 2 (App Principal: Nginx + React + Flask)
# Ejecutar con permisos de root en Debian 12 / 13
# ==============================================================================
set -e

echo "[PASO 1/6] Actualizando e instalando paquetes..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv libpq-dev git nginx curl nodejs npm

echo "[PASO 2/6] Descargando código desde la rama unidad-1..."
rm -rf /tmp/admin-proyecto
git clone -b unidad-1 https://github.com/Nappie47/admin-proyecto.git /tmp/admin-proyecto

echo "[PASO 3/6] Desplegando Backend Flask en /var/www/cementerio-backend..."
sudo mkdir -p /var/www/cementerio-backend
sudo cp -r /tmp/admin-proyecto/backend/* /var/www/cementerio-backend/
cd /var/www/cementerio-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn

# Configurar variables de entorno apuntando a HAProxy DB (10.0.3.10:5000)
sudo cp /tmp/admin-proyecto/vms/vm-2-app-principal/.env /var/www/cementerio-backend/.env

# Poblar base de datos inicial si es la primera vez
echo "[INFO] Poblando base de datos con coordenadas reales..."
python -m seeds.seed_data || echo "[WARN] Seed ya poblado o tablas existentes."

# Configurar servicio systemd
sudo cp /tmp/admin-proyecto/vms/vm-2-app-principal/cementerio-backend.service /etc/systemd/system/cementerio-backend.service
sudo systemctl daemon-reload
sudo systemctl restart cementerio-backend
sudo systemctl enable cementerio-backend

echo "[PASO 4/6] Compilando Frontend React..."
cd /tmp/admin-proyecto/frontend
npm install
npm run build

sudo mkdir -p /var/www/cementerio-frontend
sudo rm -rf /var/www/cementerio-frontend/*
sudo cp -r dist/* /var/www/cementerio-frontend/

echo "[PASO 5/6] Configurando Nginx como Reverse Proxy..."
sudo cp /tmp/admin-proyecto/vms/vm-2-app-principal/nginx.conf /etc/nginx/sites-available/default
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "[PASO 6/6] Verificando salud de los servicios..."
curl -I http://127.0.0.1/
curl http://127.0.0.1/api/health

echo "=== VM 2 CONFIGURADA Y EN LÍNEA ==="
