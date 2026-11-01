#!/bin/bash
# ==============================================================================
# SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN: VM 4 (HAProxy DB + etcd node-4)
# Ejecutar con permisos de root en Debian 12 / 13
# ==============================================================================
set -e

echo "[PASO 1/4] Actualizando paquetes del sistema..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y etcd-server etcd-client haproxy postgresql-client curl

echo "[PASO 2/4] Configurando etcd (node-4)..."
sudo cp etcd.default /etc/default/etcd
sudo systemctl stop etcd
sudo rm -rf /var/lib/etcd/default.etcd/*
sudo chown -R etcd:etcd /var/lib/etcd
sudo systemctl start etcd
sudo systemctl enable etcd

echo "[PASO 3/4] Configurando HAProxy DB (L4 con chequeo HTTP Patroni)..."
sudo cp haproxy.cfg /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
sudo systemctl enable haproxy

echo "[PASO 4/4] Verificando servicios..."
sudo systemctl status etcd --no-pager
sudo systemctl status haproxy --no-pager

echo "=== VM 4 CONFIGURADA CON ÉXITO ==="
