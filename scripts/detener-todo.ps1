# ==========================================================
# SCRIPT PARA DETENER TODAS LAS CAPAS DE LA ARQUITECTURA 2
# ==========================================================

$root = Split-Path -Parent $PSScriptRoot

Write-Host "Deteniendo contenedores de cada máquina virtual..." -ForegroundColor Yellow

$vms = @(
    "vm-1-haproxy-web",
    "vm-2-app-principal",
    "vm-3-app-replica",
    "vm-4-haproxy-db",
    "vm-5-db-primaria",
    "vm-6-db-replica",
    "vm-7-backup-server"
)

foreach ($vm in $vms) {
    Write-Host "  -> Deteniendo $vm..." -ForegroundColor Gray
    Set-Location "$root\vms\$vm"
    docker compose down 2>$null
}

Set-Location "$root"
Write-Host "`nTodas las VMs han sido detenidas limpiamente." -ForegroundColor Green
