# VM 6: Servidor de Base de Datos 2 (Réplica)
## Capa 4 - Arquitectura 2: PostgreSQL 16 + PostGIS (Solo Lectura)

### 1. Especificación en Google Cloud Platform (Bajo Costo)
- **Tipo de Máquina:** `e2-small` (2 vCPU, 2 GB RAM).
- **Costo Mensual Estimado:** ~$12.22 USD/mes (Estándar) o **~$3.60 USD/mes** (Instancia Spot).
- **Sistema Operativo:** Debian 12 Minimal.
- **Disco:** 20 GB Standard Persistent Disk (`pd-standard`).
- **IP Privada VPC:** `10.0.3.12` (Subred DB).

### 2. Función en la Arquitectura
Recibe consultas de solo lectura enrutadas por el puerto `5001` de HAProxy DB (VM 4). Alivia la carga de lecturas masivas y búsquedas espaciales ciudadanas sobre el cementerio, dejando el nodo primario disponible para inserciones y actualizaciones administrativas.

### 3. Comandos de Ejecución

#### En tu PC (Desarrollo Local):
```bash
cd vms/vm-6-db-replica
docker compose up -d
```

#### En Google Cloud Platform:
```bash
gcloud compute ssh vm-6-db-replica --zone=us-central1-a
cd admin-proyecto/vms/vm-6-db-replica
docker compose up -d
```
