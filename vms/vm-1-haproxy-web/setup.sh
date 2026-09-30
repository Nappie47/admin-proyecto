#!/bin/bash
# ==============================================================================
# SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN: VM 1 (HAProxy Web Ingress)
# Ejecutar con permisos de root en Debian 12 / 13
# ==============================================================================
set -e

echo "[PASO 1/3] Actualizando e instalando HAProxy..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y haproxy curl

echo "[PASO 2/3] Configurando balanceador web L7 hacia 10.0.2.11 y 10.0.2.12..."
sudo cp haproxy.cfg /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
sudo systemctl enable haproxy

echo "[PASO 3/3] Verificando estado..."
sudo systemctl status haproxy --no-pager

echo "=== VM 1 LISTA Y ESCUCHANDO EN PUERTO 80 ==="
