#!/bin/bash
# ==============================================================================
# SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN: VM 6 (PostgreSQL 17 + Patroni Replica)
# Ejecutar con permisos de root en Debian 12 / 13
# ==============================================================================
set -e

echo "[PASO 1/4] Instalando PostgreSQL, PostGIS, etcd y Patroni..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y postgresql postgresql-contrib postgresql-postgis postgis \
                    etcd-server etcd-client patroni python3-psycopg2 python3-etcd curl

echo "[PASO 2/4] Deshabilitando el PostgreSQL nativo..."
sudo systemctl stop postgresql
sudo systemctl disable postgresql

echo "[PASO 3/4] Configurando etcd (node-6)..."
sudo cp etcd.default /etc/default/etcd
sudo systemctl stop etcd
sudo rm -rf /var/lib/etcd/default.etcd/*
sudo chown -R etcd:etcd /var/lib/etcd
sudo systemctl start etcd
sudo systemctl enable etcd

echo "[PASO 4/4] Configurando Patroni (node-6)..."
sudo mkdir -p /var/lib/postgresql/17/patroni
sudo chown -R postgres:postgres /var/lib/postgresql
sudo chmod 700 /var/lib/postgresql/17/patroni

sudo cp config.yml /etc/patroni/config.yml
sudo chown postgres:postgres /etc/patroni/config.yml
sudo chmod 600 /etc/patroni/config.yml

sudo systemctl restart patroni
sudo systemctl enable patroni

echo "=== VM 6 CONFIGURADA CON ÉXITO ==="
