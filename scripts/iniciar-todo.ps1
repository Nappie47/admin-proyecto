# ==========================================================
# SCRIPT DE DESPLIEGUE LOCAL - ARQUITECTURA 2 COMPLETA
# Proyecto Cementerio General Comuna de Los Ángeles
# ==========================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   DESPLIEGUE ARQUITECTURA 2: CEMENTERIO DE LOS ÁNGELES     " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Crear red Docker cluster si no existe
Write-Host "`n[PASO 1/6] Configurando red Docker compartida..." -ForegroundColor Yellow
$netExists = docker network ls --filter name=red_cementerio_cluster -q
if (-not $netExists) {
    docker network create red_cementerio_cluster | Out-Null
    Write-Host "  -> Red 'red_cementerio_cluster' creada exitosamente." -ForegroundColor Green
} else {
    Write-Host "  -> Red 'red_cementerio_cluster' ya existe." -ForegroundColor Green
}

# 2. Iniciar Capa 4: Bases de Datos (Primario y Réplica)
Write-Host "`n[PASO 2/6] Iniciando CAPA 4: Bases de Datos (PostgreSQL 16 + PostGIS)..." -ForegroundColor Yellow
Set-Location "$root\vms\vm-5-db-primaria"
docker compose up -d
Set-Location "$root\vms\vm-6-db-replica"
docker compose up -d
Write-Host "  -> Esperando 6 segundos a que PostgreSQL esté listo..." -ForegroundColor Gray
Start-Sleep -Seconds 6

# 3. Iniciar Capa 3: Balanceador de Base de Datos HAProxy DB
Write-Host "`n[PASO 3/6] Iniciando CAPA 3: Balanceador de BD (HAProxy DB)..." -ForegroundColor Yellow
Set-Location "$root\vms\vm-4-haproxy-db"
docker compose up -d

# 4. Iniciar Capa 2: Servidores de Aplicaciones (VM 2 y VM 3)
Write-Host "`n[PASO 4/6] Iniciando CAPA 2: Servidores de Aplicaciones (Nginx + Frontend + Flask)..." -ForegroundColor Yellow
Set-Location "$root\vms\vm-2-app-principal"
docker compose up -d --build
Set-Location "$root\vms\vm-3-app-replica"
docker compose up -d --build

# 5. Iniciar Capa 1: Balanceador de Carga Web (HAProxy Web Ingress)
Write-Host "`n[PASO 5/6] Iniciando CAPA 1: Balanceador Web Ingress (HAProxy Web)..." -ForegroundColor Yellow
Set-Location "$root\vms\vm-1-haproxy-web"
docker compose up -d

# 6. Iniciar Capa 5: Servidor de Respaldo Automatizado
Write-Host "`n[PASO 6/6] Iniciando CAPA 5: Servidor de Respaldos (pg_dump + Cron)..." -ForegroundColor Yellow
Set-Location "$root\vms\vm-7-backup-server"
docker compose up -d --build

Set-Location "$root"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   ARQUITECTURA 2 DESPLEGADA EXITOSAMENTE EN TU PC          " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Acceso a la Plataforma:" -ForegroundColor White
Write-Host "  * INGRESS PRINCIPAL (HAProxy):    http://localhost" -ForegroundColor Cyan
Write-Host "  * Estadísticas de Tráfico:        http://localhost/haproxy?stats" -ForegroundColor Cyan
Write-Host "  * Servidor App 1 (Directo):       http://localhost:8081" -ForegroundColor Gray
Write-Host "  * Servidor App 2 (Directo):       http://localhost:8082" -ForegroundColor Gray
Write-Host "  * PostgreSQL Primario:            localhost:5432" -ForegroundColor Gray
Write-Host "  * PostgreSQL Réplica:             localhost:5433" -ForegroundColor Gray
Write-Host "  * HAProxy DB (Puerto Escritura):  localhost:5000" -ForegroundColor Gray
Write-Host "============================================================`n" -ForegroundColor Cyan
