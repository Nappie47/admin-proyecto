# Diagnostico y Verificacion de Estado - Arquitectura 2
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "        VERIFICACION DE ESTADO - ARQUITECTURA 2             " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "1. Estado de Contenedores Docker:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n2. Comprobacion de API Health (/api/health):" -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "http://localhost/api/health" -Method Get -TimeoutSec 5
    Write-Host "  -> Estado API Ingress: [OK] $($res.status) ($($res.service))" -ForegroundColor Green
} catch {
    Write-Host "  -> Error conectando a API: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Comprobacion de Patios (/api/patios):" -ForegroundColor Yellow
try {
    $patios = Invoke-RestMethod -Uri "http://localhost/api/patios" -Method Get -TimeoutSec 5
    Write-Host "  -> Patios cargados: $(($patios.patios).Count) patios cartograficos activos." -ForegroundColor Green
} catch {
    Write-Host "  -> Error consultando patios: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Comprobacion de Mausoleos (/api/mausoleos):" -ForegroundColor Yellow
try {
    $mausoleos = Invoke-RestMethod -Uri "http://localhost/api/mausoleos" -Method Get -TimeoutSec 5
    Write-Host "  -> Mausoleos cargados: $($mausoleos.total) monumentos historicos registrados." -ForegroundColor Green
} catch {
    Write-Host "  -> Error consultando mausoleos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Comprobacion de Sepulturas (/api/sepulturas):" -ForegroundColor Yellow
try {
    $sep = Invoke-RestMethod -Uri "http://localhost/api/sepulturas?per_page=1" -Method Get -TimeoutSec 5
    Write-Host "  -> Total de Sepulturas en BD: $($sep.total) registros georreferenciados." -ForegroundColor Green
} catch {
    Write-Host "  -> Error consultando sepulturas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n6. Comprobacion de Respaldos (/backups):" -ForegroundColor Yellow
try {
    $backups = docker exec vm7_backup_server ls -lh /backups
    Write-Host "  -> Archivos de respaldo en VM 7:" -ForegroundColor Green
    Write-Host $backups -ForegroundColor Gray
} catch {
    Write-Host "  -> Servidor de respaldo no iniciado aun." -ForegroundColor Yellow
}

Write-Host "============================================================" -ForegroundColor Cyan
