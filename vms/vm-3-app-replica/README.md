# VM 3: Servidor de Aplicaciones 2 (Réplica)
## Capa 2 - Arquitectura 2: Frontend y Backend Secundario

### 1. Especificación en Google Cloud Platform (Bajo Costo)
- **Tipo de Máquina:** `e2-small` (2 vCPU, 2 GB RAM).
- **Costo Mensual Estimado:** ~$12.22 USD/mes (Estándar) o **~$3.60 USD/mes** (Instancia Spot).
- **Sistema Operativo:** Debian 12 Minimal.
- **Disco de Arranque:** 15 GB Standard Persistent Disk (`pd-standard`).
- **IP Privada VPC:** `10.0.2.12` (Subred App).

### 2. Función en el Clúster
Actúa como réplica activa de la capa de aplicaciones. El balanceador HAProxy Web (VM 1) distribuye el 50% de las peticiones a esta instancia. Si la VM 2 falla o requiere mantenimiento, VM 3 asume el 100% de la carga sin caída de servicio para los ciudadanos.

### 3. Comandos de Ejecución

#### En tu PC (Desarrollo Local):
```bash
cd vms/vm-3-app-replica
docker compose up -d --build
# Probar directamente en el navegador:
# http://localhost:8082
```

#### En Google Cloud Platform:
```bash
gcloud compute ssh vm-3-app-replica --zone=us-central1-a
cd admin-proyecto/vms/vm-3-app-replica
docker compose up -d --build
```
