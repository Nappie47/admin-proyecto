# Arquitectura de Contenedores con Alta Disponibilidad - Unidad 2
## Sistema de Información Geográfica - Cementerio General de Los Ángeles
**Autores:** Bryan Ahumada - Johan Muñoz  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Licitación Mercado Público:** 2411-8-LE25  

---

## 1. Evolución Técnica y Correspondencia con la Unidad 1

En la Unidad 2, la arquitectura mantiene una correspondencia directa 1:1 con la topología de servicios implementada sobre 6 máquinas virtuales en la Unidad 1, evolucionándola hacia un ecosistema de **microservicios contenerizados y orquestados mediante Docker Compose**.

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
                           │ Evolución a Contenedores
                           ▼
┌────────────────────────────────────────────────────────┐
│              UNIDAD 2 (Docker Compose Stack)           │
├────────────────────────────────────────────────────────┤
│ • sig_gateway     (HAProxy 2.8 L7 Ingress :80 / :8404) │
│ • sig_frontend_1  (React 18 SPA servida en Nginx)      │
│ • sig_frontend_2  (React 18 SPA Réplica)               │
│ • sig_backend_1   (Flask API Gunicorn 3 workers)       │
│ • sig_backend_2   (Flask API Gunicorn Réplica)         │
│ • sig_haproxy_db  (HAProxy 2.8 TCP L4 :5000 / :5001)   │
│ • sig_db_primary  (PostGIS 3.4 / Postgres 16 Primaria) │
│ • sig_db_replica  (PostGIS 3.4 / Postgres 16 Standby)  │
│ • sig_prometheus  (Scrape de Métricas :9090)           │
│ • sig_grafana     (Dashboards de Observabilidad :3000) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Descripción de Capas y Resiliencia

### Capa 1: Ingress / Gateway L7 (`sig_gateway`)
- **Tecnología:** `haproxy:2.8-alpine`.
- **Puerto:** `80` (Tráfico público) y `8404` (Dashboard de estadísticas).
- **Mecanismo:** Analiza la URI solicitada:
  - Si coincide con el prefijo `/api/`, enruta hacia el clúster de API REST (`backend_1` y `backend_2`).
  - Para cualquier otra ruta, enruta hacia el clúster de interfaz web (`frontend_1` y `frontend_2`).
- **Resiliencia:** Verifica activamente el estado de los servidores (`GET /health` y `GET /api/health`). Si un nodo falla 3 veces consecutivas, es extraído del balanceo en menos de 9 segundos y el tráfico se mantiene en el nodo sano.

### Capa 2: Microservicios de Aplicación Replicados
- **Frontend Replicado (`frontend_1` y `frontend_2`):** Construidos mediante multi-stage build (`node:20-alpine` -> `nginx-unprivileged:1.27-alpine`). Corren bajo usuario sin privilegios `nginx` (UID 101).
- **Backend Replicado (`backend_1` y `backend_2`):** API REST en Python 3.11-slim servida por Gunicorn con 3 workers concurrentes. Corren bajo usuario seguro `appuser` (UID 10001). Ambas instancias se conectan a la base de datos a través del balanceador TCP interno `haproxy_db:5000`.

### Capa 3: Balanceo de Base de Datos L4 (`sig_haproxy_db`)
- **Tecnología:** `haproxy:2.8-alpine` en modo TCP.
- **Puertos:**
  - `5000`: Escritura y transacciones. Monitorea el estado de PostgreSQL (`option pgsql-check user postgres`). Apunta a `db_primary` y conmuta automáticamente a `db_replica` como fallback en caso de fallo del primario.
  - `5001`: Lectura distribuida en Round-Robin entre ambas instancias.
  - `7000`: Dashboard web de estadísticas y métricas de conexiones TCP.

### Capa 4: Persistencia y Base de Datos Espacial
- **Nodos:** `db_primary` y `db_replica` ejecutando `postgis/postgis:16-3.4-alpine`.
- **Persistencia Desacoplada:** Los datos residen en volúmenes nombrados independientes (`sig_pgdata_primary_volume` y `sig_pgdata_replica_volume`), garantizando la preservación de la información espacial ante cualquier reinicio o recreación de contenedores.
- **Aislamiento de Red:** Ubicadas en la red `sig_db_network` configurada con `internal: true`, lo que impide el acceso no autorizado desde el host o internet.

### Capa 5: Observabilidad y Monitoreo
- **Prometheus (v2.54.1):** Recolecta métricas cada 10 segundos de los dos balanceadores (Web y DB) y de los dos backends.
- **Grafana (v11.2.0):** Dashboard preconfigurado con visualización en vivo de la disponibilidad (estado `UP` o `DOWN`) y tiempos de respuesta.
