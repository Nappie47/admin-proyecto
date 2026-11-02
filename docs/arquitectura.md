# Arquitectura de Contenedores con Alta Disponibilidad y Microservicio de IA - Unidad 2
## Sistema de Información Geográfica - Cementerio General de Los Ángeles
**Autores:** Bryan Ahumada - Johan Muñoz  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Licitación Mercado Público:** 2411-8-LE25  

---

## 1. Evolución Técnica y Correspondencia con la Unidad 1

En la Unidad 2, la arquitectura mantiene una correspondencia directa con la topología de servicios implementada sobre 6 máquinas virtuales en la Unidad 1, evolucionándola hacia un ecosistema de **11 microservicios contenerizados y orquestados mediante Docker Compose**, integrando además una capa inteligente de **Reconocimiento Facial Biométrico con IA**.

### Tabla de Correspondencia Arquitectónica

```
┌────────────────────────────────────────────────────────┐
│                   UNIDAD 1 (6 VMs GCP)                 │
├────────────────────────────────────────────────────────┤
│ • VM-1: vm-web-haproxy (Balanceador Web L7)            │
│ • VM-2: vm-app-1 (Nginx + React + Flask Gunicorn)      │
│ • VM-3: vm-app-2 (Réplica Nginx + React + Flask)       │
│ • VM-4: vm-db-haproxy (Balanceador DB L4 TCP)          │
│ • VM-5: vm-db-master (PostgreSQL + PostGIS Primaria)   │
│ • VM-6: vm-db-replica (PostgreSQL + PostGIS Standby)   │
└──────────────────────────┬─────────────────────────────┘
                           │ Evolución a Microservicios + IA
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              UNIDAD 2 (Docker Compose Stack - 11 Nodos)         │
├─────────────────────────────────────────────────────────────────┤
│ • sig_gateway     (HAProxy 2.8 L7 Ingress :8000 / :8404 Stats)  │
│ • sig_frontend_1  (React 18 SPA servida en Nginx no-root :8080) │
│ • sig_frontend_2  (React 18 SPA Réplica :8080)                  │
│ • sig_backend_1   (Flask API Gunicorn 3 workers :5000)          │
│ • sig_backend_2   (Flask API Gunicorn Réplica :5000)            │
│ • sig_ai_service  (Microservicio IA Reconocimiento Facial :5001)│
│ • sig_haproxy_db  (HAProxy 2.8 TCP L4 :5000 / :5001 / :7070)    │
│ • sig_db_primary  (PostGIS 3.4 / Postgres 16 Primaria)          │
│ • sig_db_replica  (PostGIS 3.4 / Postgres 16 Standby)           │
│ • sig_prometheus  (Telemetría y Scrape de Métricas :9090)       │
│ • sig_grafana     (Dashboards de Observabilidad :3000)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Descripción de Capas y Resiliencia

### Capa 1: Ingress / Gateway L7 (`sig_gateway`)
- **Tecnología:** `haproxy:2.8-alpine`.
- **Puertos:** `8000` (Tráfico público hacia el puerto interno 80) y `8404` (Dashboard de estadísticas y exportador Prometheus).
- **Enrutamiento Inteligente por Ruta (ACLs):**
  - `path_beg /api/ai/` -> Redirige directamente al clúster de Inteligencia Artificial (`sig_ai_service:5001`).
  - `path_beg /api/` -> Enruta hacia el clúster de API REST (`backend_1` y `backend_2` en balanceo Round-Robin).
  - Cualquier otra ruta -> Enruta hacia el clúster de frontend web (`frontend_1` y `frontend_2`).
- **Resiliencia:** Realiza health checks activos cada 3 segundos (`GET /health` y `GET /api/health`). Si un nodo backend o frontend falla 3 veces seguidas, es retirado automáticamente del grupo en menos de 9 segundos.

### Capa 2: Microservicios Web y Backend Replicados
- **Frontend Replicado (`frontend_1` y `frontend_2`):** Construidos mediante multi-stage build (`node:20-alpine` -> `nginx-unprivileged:1.27-alpine`). Corren bajo usuario seguro sin privilegios `nginx` (UID 101). Incorpora soporte para captura de video webcam en tiempo real mediante WebRTC (`navigator.mediaDevices.getUserMedia`) con visor en óvalo para encuadre facial.
- **Backend Replicado (`backend_1` y `backend_2`):** API REST en Python 3.11-slim servida por Gunicorn. Corren bajo usuario seguro `appuser` (UID 10001). Conectados a la base de datos a través de `haproxy_db:5000` y al microservicio de IA mediante `http://ai_service:5001`.

### Capa 2 (IA): Microservicio de Biometría y Reconocimiento Facial (`sig_ai_service`)
- **Tecnología:** Python 3.11-slim, OpenCV (`opencv-contrib-python-headless`), Gunicorn, NumPy.
- **Puerto:** `5001`.
- **Modelo y Algoritmo:**
  1. **Detección y Normalización:** Emplea el modelo Haar-Cascade frontal de OpenCV (`haarcascade_frontalface_default.xml` embebido) con recorte automático centrado, escalado a 128x128 píxeles y ecualización de histograma para invariancia ante variaciones de iluminación.
  2. **Descriptor Biométrico:** Genera un vector multirrasgo que combina sub-bloques espaciales (8x8) con matrices de gradiente Sobel (rasgos de cejas, ojos, tabique y comisura de labios).
  3. **Discriminación Pearson:** El vector resultante es centrado respecto a su media y normalizado a norma $L_2 = 1$, permitiendo calcular una correlación de Pearson estricta. Rostros no coincidentes producen similitudes inferiores al 50%, mientras que rostros auténticos superan el umbral del 72% - 100%.
- **Persistencia Segura de Perfiles:** Volumen nombrado `sig_ai_data` montado en `/app/data/faces/`. Permite reiniciar o reconstruir los contenedores sin perder los patrones biométricos enrolados.
- **Seguridad:** Corre bajo el usuario no privilegiado `appuser` (UID 10001) con comprobaciones de salud periódicas (`curl -f http://127.0.0.1:5001/health`).

### Capa 3: Balanceo de Base de Datos L4 (`sig_haproxy_db`)
- **Tecnología:** `haproxy:2.8-alpine` en modo TCP.
- **Puertos:**
  - `5000`: Escritura y transacciones. Monitorea activamente a PostgreSQL (`option pgsql-check user postgres`). Apunta a `db_primary` y conmuta automáticamente a `db_replica` como fallback si el primario se desconecta.
  - `5001`: Balanceo de consultas de sólo lectura en Round-Robin entre ambas instancias.
  - `7070` (Mapeado a puerto interno 7000): Dashboard web de estadísticas TCP y exportador Prometheus.

### Capa 4: Persistencia y Base de Datos Espacial
- **Nodos:** `db_primary` y `db_replica` ejecutando `postgis/postgis:16-3.4-alpine`.
- **Volúmenes Nombrados:** `sig_pgdata_primary_volume` y `sig_pgdata_replica_volume`.
- **Aislamiento de Red:** Ubicadas en la red `sig_db_network` configurada con `internal: true`, impidiendo el acceso no autorizado desde el host o internet.

### Capa 5: Observabilidad y Monitoreo
- **Prometheus (v2.54.1):** Recolecta métricas cada 10 segundos de los 6 objetivos activos:
  1. `prometheus:9090` (Métricas del propio motor)
  2. `gateway_web:8404` (Conexiones HTTP y balanceo L7)
  3. `backend_1:5000` (Tráfico de API y estado de base de datos)
  4. `backend_2:5000` (Réplica de API)
  5. `ai_service:5001` (Disponibilidad de IA, total de peticiones, perfiles enrolados, reconocimientos exitosos y fallidos)
  6. `haproxy_db:7000` (Conexiones TCP y disponibilidad de PostgreSQL)
- **Grafana (v11.2.0):** Dashboard en puerto `3000` con visualización en tiempo real del estado de salud de todos los microservicios.
