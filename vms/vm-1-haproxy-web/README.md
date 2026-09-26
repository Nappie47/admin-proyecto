# VM 1: Balanceador de Carga Web (HAProxy)
## Capa 1 - Arquitectura 2: Ingress Público

### 1. Especificación en Google Cloud Platform (Bajo Costo)
- **Tipo de Máquina:** `e2-micro` (2 vCPU burstable, 1 GB RAM).
- **Costo Mensual Estimado:** **$0.00 USD** (Cubre la cuota del programa *Always Free Tier* de GCP si se ubica en `us-central1` o `us-east1`) o ~$1.80 USD/mes si es instancia Spot.
- **Sistema Operativo:** Debian 12 Minimal / Ubuntu 22.04 LTS Minimal.
- **Disco de Arranque:** 10 GB Standard Persistent Disk (`pd-standard`).
- **IP Pública Externa:** Sí (Efímera o Estática reservada) con etiquetas de firewall `http-server`, `https-server`.
- **IP Privada VPC:** `10.0.1.10` (Subred DMZ).

### 2. Función del Contenedor Docker
Ejecuta la imagen oficial `haproxy:2.8-alpine`. Recibe el tráfico web entrante en el puerto `80` (y `443` en producción) y lo distribuye uniformemente (Round-Robin) entre el Servidor de Aplicaciones 1 (`vm-2-app-principal`) y el Servidor de Aplicaciones 2 (`vm-3-app-replica`).

Realiza comprobaciones periódicas de estado (`/api/health`) cada 3 segundos: si una instancia de aplicación se cae, el balanceador redirige el 100% del tráfico a la otra sin interrupción del servicio.

### 3. Comandos de Ejecución

#### En tu PC (Desarrollo Local):
```bash
# Asegurarse de que la red compartida exista:
docker network create red_cementerio_cluster

# Iniciar la VM 1:
docker compose up -d

# Ver registros de tráfico:
docker compose logs -f
```

#### En Google Cloud Platform:
1. Conéctate a la VM por SSH: `gcloud compute ssh vm-1-haproxy-web --zone=us-central1-a`
2. Clona el repositorio git: `git clone <tu-repo-url> && cd admin-proyecto/vms/vm-1-haproxy-web`
3. Ajusta `haproxy.cfg` con las IPs privadas internas de VM 2 y VM 3 (ej. `10.0.2.11:80` y `10.0.2.12:80`).
4. Inicia con Docker: `docker compose up -d`
