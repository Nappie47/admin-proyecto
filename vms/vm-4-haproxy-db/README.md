# VM 4: Balanceador de Carga de Base de Datos (HAProxy DB)
## Capa 3 - Arquitectura 2: Enrutador de Conexiones PostgreSQL

### 1. Especificación en Google Cloud Platform (Bajo Costo)
- **Tipo de Máquina:** `e2-micro` (2 vCPU, 1 GB RAM).
- **Costo Mensual Estimado:** ~$6.11 USD/mes (Estándar) o **~$1.80 USD/mes** (Instancia Spot).
- **Sistema Operativo:** Debian 12 Minimal.
- **Disco de Arranque:** 10 GB Standard Persistent Disk (`pd-standard`).
- **IP Privada VPC:** `10.0.3.10` (Subred DB).

### 2. Función en la Arquitectura
Implementa balanceo y tolerancia a fallos en la capa de datos:
- Expone el **puerto 5000** hacia las aplicaciones: enruta todas las conexiones de escritura al nodo primario `vm-5-db-primaria`.
- Expone el **puerto 5001** para lecturas pesadas: enruta hacia la réplica `vm-6-db-replica`. Si la réplica no responde, conmuta automáticamente como respaldo al nodo primario.

### 3. Comandos de Ejecución

#### En tu PC (Desarrollo Local):
```bash
cd vms/vm-4-haproxy-db
docker compose up -d
```

#### En Google Cloud Platform:
```bash
gcloud compute ssh vm-4-haproxy-db --zone=us-central1-a
cd admin-proyecto/vms/vm-4-haproxy-db
docker compose up -d
```
