#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado - Unidad 2
# Proyecto: SIG Cementerio General de Los Ángeles
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${PROJECT_ROOT}"

echo "================================================================="
echo " [SIG CEMENTERIO] Despliegue de Arquitectura Containerizada (U2)"
echo " Integrantes: Bryan Ahumada - Johan Muñoz"
echo "================================================================="

# 1. Validar prerrequisitos
command -v docker >/dev/null 2>&1 || { echo "[ERROR] Docker no está instalado."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "[ERROR] Docker Compose no está instalado."; exit 1; }

# 2. Validar o inicializar archivo .env
if [ ! -f ".env" ]; then
    echo "[AVISO] Archivo .env no encontrado. Creando a partir de .env.example..."
    cp .env.example .env
    echo "[INFO] Archivo .env generado. Puedes personalizarlo según tus necesidades."
fi

# 3. Construir y levantar contenedores
echo "[1/3] Construyendo imágenes y levantando clúster de servicios..."
docker compose up -d --build

# 4. Esperar a que los health checks pasen a 'healthy'
echo "[2/3] Esperando verificación de salud de los servicios..."
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    UNHEALTHY=$(docker compose ps --format json | grep -c '"Health":"starting"' || true)
    if [ "$UNHEALTHY" -eq 0 ]; then
        break
    fi
    sleep 3
    ELAPSED=$((ELAPSED + 3))
    echo "      ...verificando contenedores (${ELAPSED}s/${TIMEOUT}s)"
done

echo "[3/3] Estado actual de los servicios:"
docker compose ps

echo "================================================================="
echo " [OK] Despliegue completado con éxito."
echo " Acceso a los servicios:"
echo "   - Plataforma SIG (Web / API Gateway): http://localhost"
echo "   - Métricas Prometheus:               http://localhost:9090"
echo "   - Dashboards Grafana:                http://localhost:3000"
echo "     (Usuario: admin / Clave: ver archivo .env)"
echo "================================================================="
