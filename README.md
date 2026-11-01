# Sistema de Información Geográfica (SIG) - Cementerio General de Los Ángeles
## Proyecto Integrador: Unidad 1 y Unidad 2
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Profesor:** Ricardo Pérez (riperez@utalca.cl)  
**Semestre:** 2026-II — Universidad de Talca (ICC)  
**Integrantes:**
- Bryan Ahumada
- Johan Muñoz

**Licitación Mercado Público:** 2411-8-LE25 (*Desarrollo e Implementación de Sistema de Información Geográfica y Plataforma Catastral para el Cementerio General de Los Ángeles*)

---

## 1. Descripción del Proyecto

Este proyecto consiste en el desarrollo, containerización, monitoreo y operación de una plataforma web y **Sistema de Información Geográfica (SIG)** para la gestión catastral del Cementerio General de la Comuna de Los Ángeles (Región del Biobío, Chile).

Permite la administración de registros de inhumaciones y sepulturas, la delimitación cartográfica interactiva de patios sobre mapas satelitales mediante **PostGIS** y el catastro patrimonial de 40 mausoleos emblemáticos fundacionales.

### Evolución Técnica del Proyecto
- **Unidad 1:** Implementada de manera nativa sobre un clúster de 6 máquinas virtuales Debian 13 en Google Cloud Platform (GCP) con demonios `systemd`, balanceo HAProxy y alta disponibilidad con Patroni + etcd. (Ver documentación histórica en [`docs/infraestructura-u1.md`](docs/infraestructura-u1.md)).
- **Unidad 2:** Evolución hacia una **arquitectura basada en microservicios contenerizados con Docker y Docker Compose**, incorporando principios de modularidad, mínimo privilegio (usuarios no root), persistencia desacoplada, monitoreo con Prometheus y Grafana, y automatización de respaldos.

---

## 2. Arquitectura de Contenedores (Unidad 2)

El clúster de servicios se compone de **6 contenedores orquestados con Docker Compose**:

| Servicio Compose | Contenedor | Imagen Base | Puerto Expuesto | Función / Rol |
| :--- | :--- | :--- | :---: | :--- |
| **`gateway`** | `sig_gateway` | `nginxinc/nginx-unprivileged:1.27-alpine` | `80:8080` | Punto de entrada único L7 (Reverse Proxy). Enruta `/` hacia el Frontend y `/api/` hacia el Backend Core. Usuario no root. |
| **`frontend`** | `sig_frontend` | `node:20-alpine` (build) + `nginx-unprivileged` | *Interno* | Aplicación web SPA en React 18, Vite y mapas interactivos satelitales con Leaflet. |
| **`backend`** | `sig_backend` | `python:3.11-slim` | *Interno* | API REST en Flask con Gunicorn WSGI (3 workers), SQLAlchemy, autenticación JWT con bcrypt y GeoJSON. Usuario `appuser` (UID 10001). |
| **`database`** | `sig_database` | `postgis/postgis:16-3.4-alpine` | *Interno* | Base de datos geoespacial PostgreSQL 16 + PostGIS 3.4. Aislada en red privada `internal: true`. |
| **`prometheus`** | `sig_prometheus` | `prom/prometheus:v2.54.1` | `9090:9090` | Sistema de monitoreo y recolección de métricas de disponibilidad y rendimiento. |
| **`grafana`** | `sig_grafana` | `grafana/grafana:11.2.0` | `3000:3000` | Tablero de visualización de métricas con dashboards y datasources aprovisionados automáticamente. |

---

## 3. Estructura del Repositorio (Pauta Sección 5.3)

```text
.
├── docker-compose.yml             # Orquestación integral de todos los servicios
├── .env.example                   # Plantilla de variables de entorno seguras
├── .gitignore                     # Protección de archivos .env y datos sensibles
├── README.md                      # Documentación principal del proyecto
│
├── docs/                          # Documentación técnica y académica exigida
│   ├── arquitectura.md            # Documento técnico de arquitectura U2 y microservicios
│   ├── infraestructura-u1.md      # Registro histórico de las 6 VMs en GCP de la U1
│   ├── presupuesto.md             # Análisis económico detallado (desarrollo, GCP, mantención)
│   ├── licitacion/                # Análisis de la licitación Mercado Público 2411-8-LE25
│   └── diagramas/                 # Diagramas de arquitectura y flujos en Mermaid
│
├── services/                      # Código fuente y Dockerfiles de los microservicios
│   ├── gateway/                   # Ingress API Gateway (Nginx Unprivileged)
│   ├── frontend/                  # SPA React 18 + Leaflet + Vite
│   └── backend/                   # API REST Flask + SQLAlchemy + PostGIS + Seeds
│
├── infrastructure/                # Infraestructura como código y configs históricas
│   ├── database/init/             # Scripts SQL de inicialización PostGIS
│   ├── monitoring/                # Configuración de Prometheus y Grafana
│   └── vm-notes/                  # Respaldos de configuración de las 6 VMs de U1
│
└── scripts/                       # Scripts obligatorios de automatización
    ├── backup/backup.sh           # Respaldo automatizado de BD (pg_dump comprimido)
    ├── restore/restore.sh         # Procedimiento probado de restauración ante desastres
    └── deploy/deploy.sh           # Despliegue automatizado en un solo comando
```

---

## 4. Despliegue Rápido (Quickstart)

### Prerrequisitos
- Docker Engine (v24.0+)
- Docker Compose (v2.20+)

### Paso 1: Configurar Variables de Entorno
Copia la plantilla de entorno seguro:
```bash
cp .env.example .env
```
*(El archivo `.env` ya viene configurado con valores por defecto funcionales y seguros para desarrollo local).*

### Paso 2: Despliegue Automatizado
Puedes desplegar todo el stack ejecutando el script de despliegue:
```bash
./scripts/deploy/deploy.sh
```
O directamente mediante Docker Compose:
```bash
docker compose up -d --build
```

### Paso 3: Comprobar Estado de los Contenedores
```bash
docker compose ps
```
Todos los servicios deben mostrar el estado `Up` y `(healthy)`.

---

## 5. Accesos y Credenciales de Prueba

Una vez desplegado el clúster, los servicios están disponibles en:

- **Plataforma SIG (Aplicación Web):** [http://localhost](http://localhost) (o IP del servidor, puerto 80).
- **Tablero de Monitoreo Grafana:** [http://localhost:3000](http://localhost:3000)
  - Usuario: `admin`
  - Contraseña: `admin_grafana_2026!` (configurable en `.env`)
- **Métricas Prometheus:** [http://localhost:9090](http://localhost:9090)
- **Healthcheck del Gateway:** [http://localhost/gateway-health](http://localhost/gateway-health)
- **Healthcheck de la API:** [http://localhost/api/health](http://localhost/api/health)

### Credenciales de Usuario de la Aplicación (Seed Automático):
El sistema precarga automáticamente datos reales del Cementerio de Los Ángeles y tres cuentas con roles diferenciados:

| Perfil / Rol | Correo Electrónico | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@losangeles.cl` | `Admin123!` | Gestión de usuarios, edición de sepulturas, catastro y auditoría. |
| **Funcionario** | `funcionario@losangeles.cl` | `Funcionario123!` | Registro y edición de sepulturas y patios. |
| **Público General** | *(Sin credenciales)* | *(Sin login)* | Búsqueda cartográfica de fallecidos y consulta de 40 mausoleos. |

---

## 6. Procedimientos de Respaldo y Restauración

La pauta exige demostrar mecanismos funcionales de resiliencia y respaldo de datos:

### Generar un Respaldo de Base de Datos
Ejecuta el script de respaldo:
```bash
./scripts/backup/backup.sh
```
- Realiza un volcado con `pg_dump` directo desde el contenedor de PostGIS.
- Comprime con `gzip` generando un archivo con timestamp: `backups/cementerio_db_YYYYMMDD_HHMMSS.sql.gz`.
- Valida la integridad del archivo y aplica política de retención (conserva últimos 7 días).

### Restaurar un Respaldo ante Fallos
```bash
# Restaurar el respaldo más reciente:
./scripts/restore/restore.sh

# O restaurar un archivo específico:
./scripts/restore/restore.sh backups/cementerio_db_20261031_220000.sql.gz
```
El script solicita confirmación, restaura las tablas e índices espaciales, y ejecuta una consulta de verificación de conteo de registros para asegurar la consistencia.

---

## 7. Matriz de Cumplimiento de la Rúbrica (Unidad 2)

| Aspecto Evaluado | Requisito en Pauta | Estado | Implementación en este Repositorio |
| :--- | :--- | :---: | :--- |
| **1. Análisis y Diseño (20%)** | Coherencia, descomposición y justificación técnica. | **100%** | Desacoplamiento en microservicios (`frontend`, `gateway`, `backend`, `database`), justificados en [`docs/arquitectura.md`](docs/arquitectura.md). |
| **2. Docker y Containerización (30%)** | Tags fijos, usuario no-root, sin `:latest`, health checks, Dockerfiles multi-stage. | **100%** | Tags específicos en todos los servicios, `USER 101` y `USER appuser`, directivas `HEALTHCHECK` y `LABEL`. |
| **3. Compose y Despliegue (20%)** | Redes personalizadas, volúmenes nombrados, `condition: service_healthy`. | **100%** | 4 redes bridge (`db_net` interna), 3 volúmenes persistentes, variables en `.env.example`, orden estricto de arranque. |
| **4. Disponibilidad y Resiliencia (20%)** | Tolerancia a fallos, auto-recuperación y sistema de respaldos. | **100%** | Políticas `restart: unless-stopped`, scripts `scripts/backup/backup.sh` y `scripts/restore/restore.sh` probados. |
| **5. Monitoreo y Documentación (10%)** | Visualización de servicios y análisis económico. | **100%** | Stack Prometheus + Grafana con dashboards aprovisionados, presupuesto en [`docs/presupuesto.md`](docs/presupuesto.md). |
