# VM 2: Servidor de Aplicaciones 1 (Principal)
## Capa 2 - Arquitectura 2: Frontend (React + Leaflet) y Backend (Python + Flask)

### 1. Especificación en Google Cloud Platform (Bajo Costo)
- **Tipo de Máquina:** `e2-small` (2 vCPU, 2 GB RAM) o `e2-micro` con archivo Swap de 1 GB.
- **Costo Mensual Estimado:** ~$12.22 USD/mes (Estándar) o **~$3.60 USD/mes** (Instancia Spot con 70% de descuento).
- **Sistema Operativo:** Debian 12 Minimal.
- **Disco de Arranque:** 15 GB Standard Persistent Disk (`pd-standard`).
- **IP Privada VPC:** `10.0.2.11` (Subred App).

### 2. Componentes Docker
Contiene dos microservicios orquestados:
1. `vm2_frontend_app1`: NGINX sirviendo la aplicación SPA en React con mapas interactivos Leaflet de los patios y sepulturas del Cementerio de Los Ángeles.
2. `vm2_backend_app1`: Servidor WSGI Gunicorn ejecutando la API REST en Python Flask, conectada a la base de datos a través del balanceador HAProxy DB (Capa 3).

### 3. Comandos de Ejecución

#### En tu PC (Desarrollo Local):
```bash
cd vms/vm-2-app-principal
docker compose up -d --build
# Probar directamente en el navegador:
# http://localhost:8081
```

#### En Google Cloud Platform:
```bash
gcloud compute ssh vm-2-app-principal --zone=us-central1-a
cd admin-proyecto/vms/vm-2-app-principal
docker compose up -d --build
```
