# 🏛️ Guía Maestra de Arquitectura, Docker Swarm y Alta Disponibilidad
## Sistema de Información Geográfica (SIG) y Gestión de Sepulturas
### Cementerio General de la Comuna de Los Ángeles
**Licitación Mercado Público:** 2411-8-LE25  
**Autores:** Bryan Ahumada - Johan Muñoz  
**Tecnologías:** Docker Swarm, HAProxy, Nginx, React 18, Leaflet, Flask (Python 3.10), PostgreSQL 16 + PostGIS 3.4  

---

## 📑 Tabla de Contenidos
1. [Descripción General del Proyecto](#1-descripción-general-del-proyecto)
2. [Evolución Arquitectónica (Unidad 1 vs Unidad 2)](#2-evolución-arquitectónica-unidad-1-vs-unidad-2)
3. [Diagnóstico y Modificaciones Realizadas Paso a Paso](#3-diagnóstico-y-modificaciones-realizadas-paso-a-paso)
4. [Teoría y Funcionamiento de Alta Disponibilidad en HAProxy](#4-teoría-y-funcionamiento-de-alta-disponibilidad-en-haproxy)
5. [Arquitectura Implementada en Docker Swarm](#5-arquitectura-implementada-en-docker-swarm)
6. [Matriz de Servicios, Réplicas y Puertos](#6-matriz-de-servicios-réplicas-y-puertos)
7. [Guía de Comandos Operativos](#7-guía-de-comandos-operativos)
8. [Credenciales y URLs de Acceso](#8-credenciales-y-urls-de-acceso)
9. [Protocolo de Demostración Universitaria (Paso a Paso)](#9-protocolo-de-demostración-universitaria-paso-a-paso)

---

## 1. Descripción General del Proyecto

Plataforma Web y Sistema de Información Geográfica (SIG) catastral para el **Cementerio General de la Comuna de Los Ángeles** (Región del Biobío, Chile), ubicado en *Camino San Antonio s/n / Av. Gabriela Mistral* (Coordenadas: `-37.4732, -72.3229`).

### Componentes Clave:
- **Frontend SPA (React 18 + Vite + Leaflet):** Búsqueda pública de difuntos por nombre/RUT/patio, visualización cartográfica de los 5 patios topográficos con geometrías reales GeoJSON, catastro patrimonial de mausoleos emblemáticos y panel administrativo de sepulturas.
- **Backend API REST (Python Flask + SQLAlchemy + Gunicorn):** Autenticación JWT con control de roles (*Administrador*, *Funcionario*, *Terreno*), CRUD de sepulturas, consultas espaciales con PostGIS y chequeo de salud (`/api/health`).
- **Base de Datos Geoespacial (PostgreSQL 16 + PostGIS):** Persistencia transaccional de coordenadas espaciales, polígonos de patios, sepulturas y usuarios.
- **Servidor de Respaldos:** Generación automatizada de respaldos completos (`pg_dump`) comprimidos en `.sql.gz` con política de retención de 7 días.

---

## 2. Evolución Arquitectónica (Unidad 1 vs Unidad 2)

| Aspecto | Unidad 1 (Despliegue Nativo GCP) | Unidad 2 (Contenedores Docker Swarm) |
| :--- | :--- | :--- |
| **Entorno** | 6 Máquinas Virtuales en Google Compute Engine | Clúster de Contenedores en Docker Swarm |
| **Aislamiento** | Demonios nativos de `systemd` sobre Debian 13 | Contenedores Docker multi-etapa ligeros |
| **Redes** | 3 Subredes VPC con IPs privadas fijas (`10.0.x.x`) | Red virtual Overlay (`cementerio_net`) con DNS interno |
| **Balanceo Web** | HAProxy L7 nativo en VM 1 | Servicio replicado (`replicas: 2`) sobre Swarm VIP |
| **Balanceo DB** | Clúster Patroni con etcd y healthcheck `:8008` | HAProxy TCP con `pgsql-check` y failover con `backup` |
| **Tolerancia a Fallos** | Manual / Failover con Patroni en VMs | **Automática en todas las capas** con Routing Mesh y Self-Healing |

---

## 3. Diagnóstico y Modificaciones Realizadas Paso a Paso

Al analizar el repositorio inicial, se detectaron incompatibilidades que impedían el despliegue en Docker:

1. **Aislamiento de Construcción (`.dockerignore`):**
   - *Problema:* No existían exclusiones, por lo que Docker copiaba `node_modules/` (70+ MB) y `.venv/` del host.
   - *Solución:* Se crearon `.dockerignore`, `backend/.dockerignore` y `frontend/.dockerignore`, optimizando el build a solo segundos.
2. **Inicialización de Base de Datos (`vms/vm-5-db-primaria/init/01-init-postgis.sql`):**
   - *Problema:* PostgreSQL solo creaba al superusuario `postgres`, pero Flask se conectaba con `app_user:AppPassword123!`.
   - *Solución:* Se incorporó la creación automática de `app_user`, asignación de contraseñas y permisos completos (`GRANT ALL PRIVILEGES`) sobre la base `cementerio_db` y el esquema `public`.
3. **Balanceador de Base de Datos (`swarm/haproxy-db.cfg`):**
   - *Problema:* HAProxy DB hacía chequeos a Patroni en el puerto `:8008` e IPs fijas `10.0.3.x`.
   - *Solución:* Se configuró el resolver DNS de Docker (`127.0.0.11:53`), chequeo nativo `option pgsql-check user postgres`, enrutamiento en puerto `5000` al Primario con réplica de respaldo (`backup`), y puerto `5001` de lectura distribuida.
4. **Servidores de Aplicación (`frontend/nginx.conf` y `backend/entrypoint.sh`):**
   - *Problema:* Nginx buscaba archivos en `/var/www/cementerio-frontend` y hacía proxy a `127.0.0.1:5000`.
   - *Solución:* Se actualizó la raíz a `/usr/share/nginx/html` y el proxy a `http://app_backend:5000/api/` para aprovechar la IP Virtual de Swarm. En el backend se ajustó la espera activa de base de datos y la ejecución automática de semillas (`seed_data.py`).
5. **Balanceador Web Ingress (`swarm/haproxy-web.cfg`):**
   - *Problema:* Apuntaba a IPs fijas de GCP `10.0.2.11` y `10.0.2.12`.
   - *Solución:* Se configuró hacia el servicio Swarm `app_frontend:80` con healthcheck activo `GET /api/health`.

---

## 4. Teoría y Funcionamiento de Alta Disponibilidad en HAProxy

### ¿Qué ocurre si un servidor se apaga físicamente?
Un proceso apagado **no puede ejecutar código de redirección**. Por lo tanto, la alta disponibilidad entre balanceadores se resuelve mediante coordinación externa:

1. **Keepalived + VRRP (Virtual Router Redundancy Protocol):**
   - Dos máquinas físicas o VMs comparten una **IP Virtual Flotante (VIP)** (ejemplo: `10.0.1.100`).
   - El nodo Master atiende el tráfico. El nodo Backup vigila con latidos (*heartbeats*) cada 1s.
   - Si el Master cae, el Backup asume la IP en milisegundos mediante *Gratuitous ARP*.
2. **Sincronización de Sesiones (`peers` en HAProxy):**
   - Ambas instancias intercambian sus tablas de memoria (*stick-tables*) por el puerto TCP 1024. Así, cuando ocurre un failover, el usuario no pierde su sesión ni login.
3. **En la Nube (Google Cloud Platform):**
   - Se utiliza un **GCP Cloud Network Load Balancer (Passthrough L4)** con una IP pública estática que supervisa la salud de las dos VMs de HAProxy. Si una VM cae, Google redirige el 100% del tráfico a la otra en 2 segundos.
4. **En Docker Swarm (Nuestra Solución):**
   - Docker Swarm implementa el **Routing Mesh (IPVS)** en el kernel de Linux.
   - El puerto `8000` está vinculado a una **IP Virtual (VIP) interna del clúster**.
   - Si una réplica de HAProxy es destruida (`docker kill`), el kernel envía inmediatamente el tráfico a la réplica superviviente **en el mismo puerto 8000 sin caída**.

---

## 5. Arquitectura Implementada en Docker Swarm

```
                        [ NAVEGADOR / CLIENTE ]
                                   │
                                   ▼
                      http://localhost:8000
                                   │
             ┌─────────────────────┴─────────────────────┐
             │       DOCKER SWARM ROUTING MESH           │
             │   (Virtual IP en Kernel Linux / IPVS)     │
             └─────────────────────┬─────────────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             │ (Mismo puerto 8000 / Sin caída)           │
             ▼                                           ▼
   [ HAProxy Web - Réplica 1 ]                 [ HAProxy Web - Réplica 2 ]
             │                                           │
             └─────────────────────┬─────────────────────┘
                                   ▼
             ┌───────────────────────────────────────────┐
             │   Swarm Service VIP: app_frontend         │
             └─────────────────────┬─────────────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼                                           ▼
   [ Frontend Nginx - Réplica 1 ]              [ Frontend Nginx - Réplica 2 ]
             │                                           │
             └─────────────────────┬─────────────────────┘
                                   ▼
             ┌───────────────────────────────────────────┐
             │   Swarm Service VIP: app_backend          │
             └─────────────────────┬─────────────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼                                           ▼
   [ Backend Flask - Réplica 1 ]               [ Backend Flask - Réplica 2 ]
             │                                           │
             └─────────────────────┬─────────────────────┘
                                   ▼
             ┌───────────────────────────────────────────┐
             │   HAProxy DB TCP (Puertos 5000 / 7000)    │
             └─────────────────────┬─────────────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼ (Escritura activa)                        ▼ (Lectura / Backup)
   [ PostgreSQL Primario ]                     [ PostgreSQL Réplica ]
             │
             ▼
   [ Servidor de Respaldos ]
```

---

## 6. Matriz de Servicios, Réplicas y Puertos

| Servicio Swarm | Capa / Rol | Réplicas | Puertos Expuestos | Modo de Red |
| :--- | :--- | :--- | :--- | :--- |
| **`cementerio_web_balancer`** | Capa 1: Ingress L7 HTTP | **2** | `8000:80`, `8404:8404` (Stats) | Ingress Swarm VIP |
| **`cementerio_app_frontend`** | Capa 2: React 18 SPA + Nginx | **2** | Interno (`:80`) | Overlay `cementerio_net` |
| **`cementerio_app_backend`** | Capa 2: Flask API + Gunicorn | **2** | Interno (`:5000`) | Overlay `cementerio_net` |
| **`cementerio_db_balancer`** | Capa 3: Proxy TCP Postgres | **1** | `7000:7000` (Stats) | Ingress Swarm VIP |
| **`cementerio_db_primary`** | Capa 4: DB Primaria PostGIS | **1** | `5432:5432` | Ingress Swarm VIP |
| **`cementerio_db_replica`** | Capa 4: DB Réplica PostGIS | **1** | `5433:5432` | Ingress Swarm VIP |
| **`cementerio_backup_server`**| Capa 5: Respaldos Cron | **1** | Volumen `/backups` | Overlay `cementerio_net` |

---

## 7. Guía de Comandos Operativos

Todos los comandos se ejecutan en la raíz del proyecto (`/home/bryan/admin-proyecto`):

### Despliegue y Control de Swarm
```bash
# 1. Desplegar o actualizar el clúster completo:
docker stack deploy -c docker-stack.yml cementerio

# 2. Ver el estado de todos los servicios y réplicas (2/2):
docker service ls

# 3. Ver cada contenedor individual (nodo, estado actual, errores):
docker stack ps cementerio

# 4. Detener todo el clúster:
docker stack rm cementerio
```

### Visualización de Logs en Tiempo Real
```bash
# Logs del balanceador web (muestra a cuál réplica envía cada petición):
docker service logs -f cementerio_web_balancer

# Logs del backend Flask:
docker service logs -f cementerio_app_backend

# Logs del servidor de respaldos:
docker service logs -f cementerio_backup_server
```

---

## 8. Credenciales y URLs de Acceso

### Enlaces en el Navegador:
- **Plataforma Web Principal:** [http://localhost:8000](http://localhost:8000)
- **Dashboard Estadísticas HAProxy Web:** [http://localhost:8404](http://localhost:8404)
- **Dashboard Estadísticas HAProxy DB:** [http://localhost:7000](http://localhost:7000)

### Credenciales de Usuario:
- **Administrador:** `admin@losangeles.cl` / `Admin123!`
- **Funcionario:** `funcionario@losangeles.cl` / `Funcionario123!`
- **Terreno:** `terreno@losangeles.cl` / `Terreno123!`

---

## 9. Protocolo de Demostración Universitaria (Paso a Paso)

Para defender tu proyecto con excelencia, sigue esta secuencia en vivo:

### Paso 1: Demostrar Funcionamiento Normal
1. Abre [http://localhost:8000](http://localhost:8000) en el navegador y muestra el mapa con los 5 patios y la búsqueda de sepulturas.
2. Inicia sesión con `admin@losangeles.cl` y `Admin123!`.
3. En la terminal, ejecuta `docker service ls` para mostrar que hay **2 réplicas activas (2/2)** en el balanceador, el frontend y el backend.

### Paso 2: Matar el Balanceador Web en Vivo (Tolerancia a Fallos Capa 1)
1. Muestra los contenedores del balanceador:
   ```bash
   docker ps | grep web_balancer
   ```
2. Mata a la fuerza uno de los dos contenedores:
   ```bash
   docker kill $(docker ps -q -f name=cementerio_web_balancer | head -n 1)
   ```
3. Recarga inmediatamente el navegador en [http://localhost:8000](http://localhost:8000) o haz:
   ```bash
   curl http://localhost:8000/api/health
   ```
   **Punto clave para explicar:** *"El sistema responde HTTP 200 OK en el MISMO puerto 8000 sin caída porque el Swarm Routing Mesh conmutó instantáneamente al segundo contenedor."*

### Paso 3: Demostrar Auto-Recuperación (*Self-Healing*)
1. A los 5 segundos de haber matado el contenedor, ejecuta:
   ```bash
   docker service ps cementerio_web_balancer
   ```
   **Punto clave para explicar:** *"Docker Swarm detectó que la réplica murió y levantó un nuevo contenedor automáticamente para mantener el estado deseado de 2 réplicas."*

### Paso 4: Matar el Backend en Vivo (Tolerancia a Fallos Capa 2)
1. Mata uno de los contenedores de backend:
   ```bash
   docker kill $(docker ps -q -f name=cementerio_app_backend | head -n 1)
   ```
2. Consulta los datos de la base de datos:
   ```bash
   curl -s http://localhost:8000/api/patios | jq .success
   ```
   *Retornará `true` de inmediato a través de la réplica superviviente.*

