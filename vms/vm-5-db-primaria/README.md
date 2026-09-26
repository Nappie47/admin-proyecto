# VM 5: Servidor de Base de Datos 1 (Primario)
## Capa 4 - Arquitectura 2: PostgreSQL 16 + PostGIS (Lectura y Escritura)

### 1. Especificación en Google Cloud Platform (Bajo Costo)
- **Tipo de Máquina:** `e2-small` (2 vCPU, 2 GB RAM). Para cargas de producción masivas de 12.000 sepulturas se recomienda `e2-medium` (4 GB RAM), pero para pruebas, evaluación y entorno piloto `e2-small` es suficiente.
- **Costo Mensual Estimado:** ~$12.22 USD/mes (Estándar) o **~$3.60 USD/mes** (Instancia Spot).
- **Sistema Operativo:** Debian 12 Minimal.
- **Disco:** 20 GB Standard Persistent Disk (`pd-standard`).
- **IP Privada VPC:** `10.0.3.11` (Subred DB).

### 2. Componentes Docker
Ejecuta `postgis/postgis:16-3.4-alpine`:
- Contiene el motor PostgreSQL 16 con las extensiones espaciales `postgis` y `postgis_topology` activadas.
- Maneja las operaciones transaccionales de escritura y lectura de sepulturas, geometrías de patios y mausoleos emblemáticos.
- Almacena datos en el volumen persistente Docker `pgdata_primary_volume` (RNF06).

### 3. Comandos de Ejecución

#### En tu PC (Desarrollo Local):
```bash
cd vms/vm-5-db-primaria
docker compose up -d
```

#### En Google Cloud Platform:
```bash
gcloud compute ssh vm-5-db-primaria --zone=us-central1-a
cd admin-proyecto/vms/vm-5-db-primaria
docker compose up -d
```
