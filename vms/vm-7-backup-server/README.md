# VM 7: Servidor de Respaldo de Datos (Backups Automáticos)
## Capa 5 - Arquitectura 2: Respaldo y Persistencia (RNF06)

### 1. Especificación en Google Cloud Platform (Bajo Costo)
- **Tipo de Máquina:** `e2-micro` (2 vCPU, 1 GB RAM) o instancia Spot.
- **Costo Mensual Estimado:** ~$6.11 USD/mes (Estándar) o **~$1.80 USD/mes** (Spot).
- **Opción de Ultra-Bajo Costo:** En GCP se puede programar para encenderse únicamente durante la ventana de respaldo nocturna (ej. 15 minutos diarios a las 03:00 AM) mediante Cloud Scheduler, reduciendo el costo a menos de **$0.15 USD/mes**.
- **Sistema Operativo:** Alpine Linux en Docker / Debian 12 en host.
- **Disco:** 15 GB Standard Persistent Disk (`pd-standard`).
- **IP Privada VPC:** `10.0.3.13` (Subred DB).

### 2. Funciones y Operaciones
- Realiza volcados periódicos mediante `pg_dump` con compresión `gzip`.
- Almacena las copias en el volumen Docker persistente `backups_cementerio_volume`.
- Aplica política de retención eliminando copias de más de 7 días para no saturar el almacenamiento.
- Soporta integración con Google Cloud Storage (`gsutil` / Bucket GCS).

### 3. Comandos de Ejecución

#### En tu PC (Desarrollo Local):
```bash
cd vms/vm-7-backup-server
docker compose up -d --build

# Ejecutar un respaldo manual inmediatamente:
docker exec -it vm7_backup_server /scripts/backup.sh

# Listar los respaldos generados:
docker exec -it vm7_backup_server ls -lh /backups
```

#### En Google Cloud Platform:
```bash
gcloud compute ssh vm-7-backup-server --zone=us-central1-a
cd admin-proyecto/vms/vm-7-backup-server
docker compose up -d --build
```
