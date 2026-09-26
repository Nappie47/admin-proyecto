# Guía de Dimensionamiento y Despliegue en Google Cloud Platform (Bajo Costo)
## Cementerio General de Los Ángeles - Arquitectura 2
**Objetivo:** Minimizar el consumo de créditos en GCP garantizando el funcionamiento completo de las 7 VMs en Docker.

---

## 1. Selección de Máquinas Virtuales en GCP al Mínimo Costo

Google Cloud ofrece la familia **E2 (Cost-Optimized)**, ideal para microservicios y contenedores ligeros. Para reducir el costo al mínimo absoluto, aplicamos la siguiente asignación por capa:

| Máquina Virtual | Rol en Arquitectura 2 | Tipo de Máquina GCP | vCPU / RAM | Disco Recomendado | Costo Est. Mes (Estándar)* | Costo Est. Mes (Spot / Preemptible)* |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VM 1: vm-1-haproxy-web** | Balanceador Web L7 | `e2-micro` | 2 vCPU (burst), 1 GB RAM | 10 GB Standard PD | **$0.00 / Gratis** (Free Tier en EE.UU.) | ~$1.80 USD |
| **VM 2: vm-2-app-principal** | App 1 (Nginx+React+Flask) | `e2-small` | 2 vCPU, 2 GB RAM | 15 GB Standard PD | ~$12.22 USD | ~$3.60 USD |
| **VM 3: vm-3-app-replica** | App 2 (Nginx+React+Flask) | `e2-small` | 2 vCPU, 2 GB RAM | 15 GB Standard PD | ~$12.22 USD | ~$3.60 USD |
| **VM 4: vm-4-haproxy-db** | Balanceador DB L4 (TCP) | `e2-micro` | 2 vCPU, 1 GB RAM | 10 GB Standard PD | ~$6.11 USD | ~$1.80 USD |
| **VM 5: vm-5-db-primaria** | PostgreSQL + PostGIS (Master) | `e2-small` (o `e2-medium`**) | 2 vCPU, 2 GB RAM | 20 GB Standard PD | ~$12.22 USD | ~$3.60 USD |
| **VM 6: vm-6-db-replica** | PostgreSQL + PostGIS (Replica) | `e2-small` | 2 vCPU, 2 GB RAM | 20 GB Standard PD | ~$12.22 USD | ~$3.60 USD |
| **VM 7: vm-7-backup-server** | Cron Respaldos pg_dump | `e2-micro` (o bajo demanda) | 2 vCPU, 1 GB RAM | 15 GB Standard PD | ~$6.11 USD | ~$1.80 USD |

*\*Precios basados en región `us-central1` (Iowa) o `us-east1` (Carolina del Sur), que son las más económicas a nivel global. Las regiones de Chile (`southamerica-west1`) son ~35% más caras.*  
*\*\*Para demostraciones y pruebas, `e2-small` (2GB RAM) corre PostgreSQL 16 + PostGIS perfectamente con los parámetros configurados en este proyecto.*

---

## 2. Los 4 Secretos para Reducir Costos al 80% en GCP

### A. Región más económica
Crea todas las instancias y la red VPC en una de las regiones con tarifa reducida:
- **`us-central1` (Iowa)** o **`us-east1` (South Carolina)**.
- En `us-central1`, Google otorga **1 instancia `e2-micro` gratis de por vida** por proyecto (Always Free Tier).

### B. Uso de Instancias Spot (Preemptible)
Las instancias **Spot** aprovechan capacidad ociosa de GCP con un **descuento entre el 60% y el 91%**:
- Para entrega de proyectos académicos o pruebas de concepto, son ideales.
- Si una instancia Spot llega a apagarse, se puede reiniciar en 1 clic.
- Reducen el costo de todo el stack de 7 VMs a menos de **$20 USD al mes** (o centavos por hora de prueba).

### C. Discos Persistentes Estándar (`pd-standard`)
Por defecto, GCP selecciona discos SSD (`pd-ssd`) o balanceados (`pd-balanced`), que son más caros. Para este proyecto, selecciona discos estándar de giro magnético (`pd-standard` a ~$0.04 USD por GB/mes):
- 10 a 20 GB por VM es suficiente y cuesta menos de $0.80 USD al mes por disco.

### D. Apagar las VMs cuando no las estés usando
El cobro de vCPU y RAM se detiene de inmediato cuando las VMs están en estado `TERMINATED` (solo pagas unos centavos por el almacenamiento del disco):
```bash
# Apagar todas las VMs del proyecto con un comando:
gcloud compute instances stop vm-1-haproxy-web vm-2-app-principal vm-3-app-replica vm-4-haproxy-db vm-5-db-primaria vm-6-db-replica vm-7-backup-server --zone=us-central1-a

# Encender todas las VMs cuando vayas a trabajar o mostrar:
gcloud compute instances start vm-1-haproxy-web vm-2-app-principal vm-3-app-replica vm-4-haproxy-db vm-5-db-primaria vm-6-db-replica vm-7-backup-server --zone=us-central1-a
```

---

## 3. Plan de Direccionamiento de Red VPC Privada en GCP

Para que la Arquitectura 2 funcione igual que en el diagrama de la licitación:

- **Red VPC:** `vpc-cementerio`
- **Subredes:**
  - `subnet-dmz` (Pública): `10.0.1.0/24` (Aloja `vm-1-haproxy-web` con IP externa pública).
  - `subnet-app` (Privada): `10.0.2.0/24` (Aloja `vm-2-app-principal` [10.0.2.11] y `vm-3-app-replica` [10.0.2.12]).
  - `subnet-db` (Privada): `10.0.3.0/24` (Aloja `vm-4-haproxy-db` [10.0.3.10], `vm-5-db-primaria` [10.0.3.11], `vm-6-db-replica` [10.0.3.12] y `vm-7-backup-server` [10.0.3.13]).

---

## 4. Script gcloud para Crear las 7 VMs de Bajo Costo en 1 Paso

Si tienes el SDK de Google Cloud (`gcloud`) instalado en tu máquina o desde Cloud Shell:

```bash
# 1. Configurar variables de proyecto
export PROJECT_ID="tu-proyecto-gcp"
export REGION="us-central1"
export ZONE="us-central1-a"

# 2. Crear las instancias con configuración de bajo costo (Debian 12 + Docker listo)
# VM 1: HAProxy Web (e2-micro)
gcloud compute instances create vm-1-haproxy-web \
    --zone=$ZONE \
    --machine-type=e2-micro \
    --provisioning-model=SPOT \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=10GB \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server

# VM 2: App 1 (e2-small)
gcloud compute instances create vm-2-app-principal \
    --zone=$ZONE \
    --machine-type=e2-small \
    --provisioning-model=SPOT \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=15GB \
    --boot-disk-type=pd-standard

# VM 3: App 2 (e2-small)
gcloud compute instances create vm-3-app-replica \
    --zone=$ZONE \
    --machine-type=e2-small \
    --provisioning-model=SPOT \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=15GB \
    --boot-disk-type=pd-standard

# VM 4: HAProxy DB (e2-micro)
gcloud compute instances create vm-4-haproxy-db \
    --zone=$ZONE \
    --machine-type=e2-micro \
    --provisioning-model=SPOT \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=10GB \
    --boot-disk-type=pd-standard

# VM 5: PostgreSQL Primario (e2-small)
gcloud compute instances create vm-5-db-primaria \
    --zone=$ZONE \
    --machine-type=e2-small \
    --provisioning-model=SPOT \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-standard

# VM 6: PostgreSQL Réplica (e2-small)
gcloud compute instances create vm-6-db-replica \
    --zone=$ZONE \
    --machine-type=e2-small \
    --provisioning-model=SPOT \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-standard

# VM 7: Servidor de Respaldo (e2-micro)
gcloud compute instances create vm-7-backup-server \
    --zone=$ZONE \
    --machine-type=e2-micro \
    --provisioning-model=SPOT \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=15GB \
    --boot-disk-type=pd-standard
```
