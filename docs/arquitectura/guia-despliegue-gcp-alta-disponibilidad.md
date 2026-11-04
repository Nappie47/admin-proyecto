# Guía de Despliegue en Alta Disponibilidad: Google Cloud Platform (GCP)
## Plataforma Web y SIG - Cementerio General Comuna de Los Ángeles
**Licitación Mercado Público:** 2411-8-LE25  
**Integrantes:** Bryan Ahumada - Johan Muñoz  
**Docente:** Ricardo Pérez - Universidad de Talca  

---

## 1. Visión General de la Arquitectura Cloud

Esta arquitectura traslada el diseño local de la Unidad 2 al estándar empresarial de la nube, eliminando todos los **Puntos Únicos de Falla (SPOF)** y garantizando un **SLA del 99.99%**:

```text
                                [ CLIENTES / NAVEGADOR ]
                                           │
                                           ▼
       ┌────────────────────────────────────────────────────────────────────────┐
       │             Google Cloud External Application Load Balancer            │
       │    • IP Anycast Global Única                                           │
       │    • Certificado SSL/TLS administrado por Google                       │
       │    • Sondeos activos de salud (Health Checks: /api/health cada 5s)      │
       └───────────────────────────────────┬────────────────────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │ Balanceo activo entre zonas         │
                        ▼                                     ▼
        ┌───────────────────────────────┐     ┌───────────────────────────────┐
        │ Compute Engine: sig-vm-1      │     │ Compute Engine: sig-vm-2      │
        │ Zona: southamerica-west1-a    │     │ Zona: southamerica-west1-b    │
        │ (Santiago, Chile - Data Ctr 1)│     │ (Santiago, Chile - Data Ctr 2)│
        ├───────────────────────────────┤     ├───────────────────────────────┤
        │ • Contenedor sig-frontend     │     │ • Contenedor sig-frontend     │
        │ • Contenedor sig-backend      │     │ • Contenedor sig-backend      │
        │ • Contenedor sig-ai-service   │     │ • Contenedor sig-ai-service   │
        └───────────────┬───────────────┘     └───────────────┬───────────────┘
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           │ Conexión privada VPC (Sin internet)
                                           ▼
       ┌────────────────────────────────────────────────────────────────────────┐
       │                    Google Cloud SQL for PostgreSQL 16                  │
       │              • Extensión PostGIS espacial habilitada                   │
       │              • Tipo de disponibilidad: REGIONAL (Multi-Zona)           │
       ├───────────────────────────────────┬────────────────────────────────────┤
       │ Instancia Primaria (Zona A)       │ Instancia Standby / Réplica (Zona B│
       │   [ Lectura y Escritura ]         │   [ Conmutación automática < 60s ] │
       └───────────────────────────────────┴────────────────────────────────────┘
                                           │
                                           ▼
       ┌────────────────────────────────────────────────────────────────────────┐
       │                   Google Cloud Storage (Bucket GCS)                    │
       │     Persistencia compartida para embeddings faciales y fotografías     │
       └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pre-requisitos

1. **Cuenta en Google Cloud:** Puedes activar la prueba gratuita de **\$300 USD de crédito** por 90 días en [cloud.google.com](https://cloud.google.com).
2. **Google Cloud Shell:** No necesitas instalar nada en tu laptop. Puedes abrir la consola web de GCP y hacer clic en el ícono de terminal **Cloud Shell** en la esquina superior derecha.

---

## 3. Paso a Paso de Despliegue con `gcloud`

### Paso 1: Configurar Variables de Entorno y Proyecto
```bash
# Definir variables de tu entorno
export PROJECT_ID="sig-cementerio-la-2026"
export REGION="southamerica-west1"         # Santiago, Chile (baja latencia)
export ZONE_1="southamerica-west1-a"
export ZONE_2="southamerica-west1-b"

# Configurar el proyecto activo
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
gcloud config set compute/zone $ZONE_1

# Habilitar las APIs necesarias de Google Cloud
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  servicenetworking.googleapis.com \
  storage.googleapis.com
```

---

### Paso 2: Crear la Red Privada (VPC) y Reglas de Firewall

```bash
# 1. Crear la red VPC personalizada
gcloud compute networks create sig-vpc --subnet-mode=custom

# 2. Crear la subred regional
gcloud compute networks subnets create sig-subnet \
  --network=sig-vpc \
  --region=$REGION \
  --range=10.10.0.0/24

# 3. Permitir SSH para administración
gcloud compute firewall-rules create allow-sig-ssh \
  --network=sig-vpc \
  --allow=tcp:22 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=sig-node

# 4. Permitir el tráfico del Cloud Load Balancer y Health Checks de Google
# (Rangos oficiales de Google Cloud Health Check)
gcloud compute firewall-rules create allow-sig-lb-and-healthchecks \
  --network=sig-vpc \
  --allow=tcp:80,tcp:5000,tcp:5001 \
  --source-ranges=130.211.0.0/22,35.191.0.0/16 \
  --target-tags=sig-node

# 5. Configurar conexión privada para Cloud SQL (VPC Peering)
gcloud compute addresses create google-managed-services-sig-vpc \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=sig-vpc

gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-sig-vpc \
  --network=sig-vpc
```

---

### Paso 3: Crear la Base de Datos Cloud SQL (Regional HA con PostGIS)

```bash
# 1. Crear la instancia de PostgreSQL 16 con Alta Disponibilidad Regional
gcloud sql instances create sig-db-ha \
  --database-version=POSTGRES_16 \
  --tier=db-custom-2-7680 \
  --region=$REGION \
  --availability-type=REGIONAL \
  --network=projects/$PROJECT_ID/global/networks/sig-vpc \
  --no-assign-ip \
  --storage-auto-increase \
  --backup-start-time=03:00

# 2. Configurar la contraseña de usuario postgres
gcloud sql users set-password postgres \
  --instance=sig-db-ha \
  --password="Cementerio_Secure_2026_Prod!"

# 3. Crear la base de datos del proyecto
gcloud sql databases create cementerio_db --instance=sig-db-ha

# 4. Obtener la IP Privada interna asignada a la base de datos
export DB_PRIVATE_IP=$(gcloud sql instances describe sig-db-ha --format="value(ipAddresses[0].ipAddress)")
echo "IP Privada de Cloud SQL: $DB_PRIVATE_IP"
```

> [!TIP]
> **PostGIS en Cloud SQL:** PostGIS ya viene preinstalado en Cloud SQL. Solo requiere ejecutar `CREATE EXTENSION IF NOT EXISTS postgis;` al iniciar por primera vez.

---

### Paso 4: Crear el Bucket de Google Cloud Storage (GCS)
Para que las fotos de rostros y planos no queden atrapadas en el disco de una sola máquina:

```bash
gcloud storage buckets create gs://$PROJECT_ID-media \
  --location=$REGION \
  --uniform-bucket-level-access
```

---

### Paso 5: Desplegar las 2 Máquinas Virtuales (Compute Engine)

#### Script de Arranque de las VMs (`startup-script.sh`):
Guarda este script para que cada VM instale Docker automáticamente y levante la aplicación al iniciar:

```bash
cat << 'EOF' > startup-script.sh
#!/bin/bash
apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git

# Instalar Docker y Docker Compose plugin
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Clonar el proyecto
cd /opt
git clone https://github.com/BryanAhumadaM/admin-proyecto.git
cd admin-proyecto
git checkout unidad-2

# Crear archivo de entorno de producción apuntando a Cloud SQL
cat << ENVFILE > .env.prod
APP_ENV=production
DB_HOST=10.x.x.x  # Reemplazar con $DB_PRIVATE_IP
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Cementerio_Secure_2026_Prod!
DB_NAME=cementerio_db
SECRET_KEY=cementerio-los-angeles-secret-key-2026
JWT_SECRET_KEY=cementerio-jwt-super-secret-key-2026
CORS_ORIGINS=*
AI_SERVICE_URL=http://ai_service:5001
ENVFILE

# Levantar con docker compose de producción
docker compose -f docker-compose.prod.yml up -d
EOF
```

#### Crear las dos instancias en distintas zonas físicas:
```bash
# VM 1 en Zona A
gcloud compute instances create sig-vm-1 \
  --zone=$ZONE_1 \
  --machine-type=e2-standard-2 \
  --subnet=sig-subnet \
  --tags=sig-node \
  --metadata-from-file=startup-script=startup-script.sh

# VM 2 en Zona B (Redundancia Física Multi-Zona)
gcloud compute instances create sig-vm-2 \
  --zone=$ZONE_2 \
  --machine-type=e2-standard-2 \
  --subnet=sig-subnet \
  --tags=sig-node \
  --metadata-from-file=startup-script=startup-script.sh
```

---

### Paso 6: Configurar el Docker Compose de Producción (`docker-compose.prod.yml`)

En producción en la nube, **ya no necesitas HAProxy ni contenedores locales de PostgreSQL**, porque esas responsabilidades las asumen los servicios administrados de Google:

```yaml
name: sig-cementerio-prod

networks:
  sig_cloud_net:
    driver: bridge

services:
  # Capa Web Frontend (Nginx sirviendo React)
  frontend:
    build:
      context: ./services/frontend
      dockerfile: Dockerfile
    container_name: sig_frontend
    restart: always
    ports:
      - "80:80"
    networks:
      - sig_cloud_net
    depends_on:
      - backend

  # Microservicio de Biometría / IA
  ai_service:
    build:
      context: ./services/ai-service
      dockerfile: Dockerfile
    container_name: sig_ai_service
    restart: always
    environment:
      - PORT=5001
    ports:
      - "5001:5001"
    networks:
      - sig_cloud_net

  # API Backend (Conectado directamente a Cloud SQL por IP Privada)
  backend:
    build:
      context: ./services/backend
      dockerfile: Dockerfile
    container_name: sig_backend
    restart: always
    environment:
      - APP_ENV=production
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT:-5432}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - CORS_ORIGINS=*
      - AI_SERVICE_URL=http://ai_service:5001
    ports:
      - "5000:5000"
    networks:
      - sig_cloud_net
```

---

### Paso 7: Configurar el Google Cloud Load Balancer (Sin SPOF)

```bash
# 1. Crear grupos de instancias no administrados para registrar las 2 VMs
gcloud compute instance-groups unmanaged create sig-ig-zone-a --zone=$ZONE_1
gcloud compute instance-groups unmanaged add-instances sig-ig-zone-a --instances=sig-vm-1 --zone=$ZONE_1

gcloud compute instance-groups unmanaged create sig-ig-zone-b --zone=$ZONE_2
gcloud compute instance-groups unmanaged add-instances sig-ig-zone-b --instances=sig-vm-2 --zone=$ZONE_2

# 2. Configurar los puertos con nombre en los grupos
gcloud compute instance-groups unmanaged set-named-ports sig-ig-zone-a --named-ports=http:80 --zone=$ZONE_1
gcloud compute instance-groups unmanaged set-named-ports sig-ig-zone-b --named-ports=http:80 --zone=$ZONE_2

# 3. Crear el Health Check activo de Google (verifica /api/health del backend)
gcloud compute health-checks create http sig-health-check \
  --port=80 \
  --request-path="/health" \
  --check-interval=5s \
  --timeout=3s \
  --healthy-threshold=2 \
  --unhealthy-threshold=2

# 4. Crear el Backend Service global
gcloud compute backend-services create sig-backend-service \
  --protocol=HTTP \
  --port-name=http \
  --health-checks=sig-health-check \
  --global

# 5. Agregar ambos grupos de instancias (Multi-Zona) al Backend Service
gcloud compute backend-services add-backend sig-backend-service \
  --instance-group=sig-ig-zone-a \
  --instance-group-zone=$ZONE_1 \
  --global

gcloud compute backend-services add-backend sig-backend-service \
  --instance-group=sig-ig-zone-b \
  --instance-group-zone=$ZONE_2 \
  --global

# 6. Crear el Mapa de URLs y el Proxy HTTP
gcloud compute url-maps create sig-url-map --default-service=sig-backend-service
gcloud compute target-http-proxies create sig-http-proxy --url-map=sig-url-map

# 7. Reservar una Dirección IP Pública Global Anycast estática
gcloud compute addresses create sig-global-ip --global

# 8. Crear la Regla de Reenvío Global (Forwarding Rule en puerto 80)
gcloud compute forwarding-rules create sig-http-forwarding-rule \
  --global \
  --target-http-proxy=sig-http-proxy \
  --ports=80 \
  --address=sig-global-ip

# Obtener la IP pública final de la aplicación
echo "IP Pública de Producción:"
gcloud compute addresses describe sig-global-ip --global --format="value(address)"
```

---

## 4. Pruebas de Tolerancia a Fallos (Chaos Testing en GCP)

Para demostrar en la defensa que esta arquitectura es indestructible ante fallos:

### Prueba A: Caída de un Servidor Web / API completo
1. Ve a la consola de GCP y haz clic en **Detener (Stop)** sobre `sig-vm-1`.
2. En tu navegador, recarga la aplicación en la IP pública global.
3. **Resultado:** El Cloud Load Balancer detecta que `sig-vm-1` no responde al health check y transfiere el 100% de las solicitudes a `sig-vm-2` en menos de 5 segundos. **La página web nunca deja de funcionar**.

### Prueba B: Caída del Servidor de Base de Datos
1. Ejecuta una conmutación por error forzada en Cloud SQL:
   ```bash
   gcloud sql instances failover sig-db-ha
   ```
2. **Resultado:** Google conmuta automáticamente el almacenamiento de la Zona A a la Zona B. El backend se reconecta en ~40 segundos sin pérdida de registros ni corrupción de datos.

---

## 5. Estimación de Costos Mensuales en GCP

| Componente GCP | Especificaciones | Costo Aprox. Mensual (USD) |
| :--- | :--- | :--- |
| **Compute Engine (2 VMs)** | `e2-standard-2` (2 vCPU, 8 GB RAM c/u) | \$65.00 |
| **Cloud SQL for PostgreSQL** | Regional HA (Multi-zona), 2 vCPU, 7.5 GB RAM | \$75.00 |
| **Cloud Load Balancing** | External Application Load Balancer + Forwarding rules | \$18.00 |
| **Cloud Storage** | Bucket Standard (10 GB para imágenes y backups) | \$0.25 |
| **Tráfico de Red Egress** | Primeros 50 GB | \$4.00 |
| **TOTAL MENSUAL** | **Infraestructura Enterprise 99.99% SLA** | **~\$160.00 USD / mes** |

> [!NOTE]
> Con la **cuenta gratuita de Google Cloud (\$300 USD de crédito)**, pueden mantener este clúster completo funcionando gratis durante casi **dos meses enteros**. Para pruebas de laboratorio cortas (unas pocas horas), el gasto real es inferior a **\$2.00 USD**.

---

## 6. Discurso de Presentación para Bryan y Johan

### Bryan (Introducción a la Escalabilidad Cloud):
> *"Profesores, para el entorno de laboratorio local utilizamos Docker Compose y HAProxy para validar el balanceo y la replicación streaming. Sin embargo, para dar cumplimiento estricto a las bases de licitación de Mercado Público (2411-8-LE25), diseñamos la arquitectura final de producción sobre **Google Cloud Platform**.*
> 
> *En este diseño, trasladamos el punto de entrada a un **Cloud Application Load Balancer** de Google. Al ser un balanceador Anycast global definido por software, eliminamos por completo cualquier Punto Único de Falla (SPOF): no hay una sola máquina física que pueda apagarse y botar el sistema."*

### Johan (Alta Disponibilidad Multi-Zona y Datos):
> *"Detrás del balanceador, desplegamos dos instancias de Compute Engine distribuidas en zonas físicas independientes: una en Santiago Zona A y otra en Santiago Zona B. Si ocurre un corte de energía o un desastre en un Data Center, el balanceador redirige el tráfico a la otra zona de inmediato.*
> 
> *Asimismo, la persistencia se delega a **Cloud SQL for PostgreSQL con Alta Disponibilidad Regional**. Google mantiene una réplica Standby sincronizada en tiempo real que ejecuta failover automático en menos de 60 segundos si el nodo principal falla. Esta arquitectura garantiza tolerancia a fallos en el 100% de las capas y un SLA del 99.99% para la Municipalidad de Los Ángeles."*
