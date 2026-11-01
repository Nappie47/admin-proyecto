# Sistema de Información Geográfica (SIG) - Cementerio General de Los Ángeles
## Proyecto Integrador: Unidad 1 y Unidad 2 (Alta Disponibilidad Completa)
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
- **Unidad 2:** Evolución directa de la infraestructura de la Unidad 1 hacia una **arquitectura basada en microservicios contenerizados con Docker Compose**, replicando la topología de capas con **alta disponibilidad de punta a punta** (HAProxy Ingress L7, Frontend replicado, Backend replicado, HAProxy DB TCP L4, Base de datos primaria y réplica, y stack de observabilidad con Prometheus y Grafana).

---

## 2. Arquitectura de Contenedores y Equivalencia con la Unidad 1

El clúster de servicios se compone de **9 contenedores orquestados con Docker Compose**, manteniendo estricta correspondencia con las 6 VMs de la Unidad 1:

| Equivalencia U1 | Servicio Compose | Contenedor | Imagen Base | Puerto | Función / Rol |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **VM-1 (Web HAProxy)** | **`gateway`** | `sig_gateway` | `haproxy:2.8-alpine` | `80:80` / `8404:8404` | **Ingress Gateway L7:** Punto único de entrada. Enruta `/` hacia el cluster web y `/api/` hacia el cluster API con Round-Robin y failover. |
| **VM-2 (App 1 Web)** | **`frontend_1`** | `sig_frontend_1` | `node:20-alpine` + `nginx-unprivileged` | *Interno* | Servidor Web Primario (React 18 + Leaflet). Usuario no root (UID 101). |
| **VM-3 (App 2 Web)** | **`frontend_2`** | `sig_frontend_2` | `node:20-alpine` + `nginx-unprivileged` | *Interno* | Servidor Web Réplica. Tolerancia a fallos en la interfaz. |
| **VM-2 (App 1 API)** | **`backend_1`** | `sig_backend_1` | `python:3.11-slim` | *Interno* | API REST Primaria (Flask + Gunicorn 3 workers). Usuario `appuser` (UID 10001). |
| **VM-3 (App 2 API)** | **`backend_2`** | `sig_backend_2` | `python:3.11-slim` | *Interno* | API REST Réplica. Tolerancia a fallos y balanceo activo de peticiones. |
| **VM-4 (DB HAProxy)** | **`haproxy_db`** | `sig_haproxy_db` | `haproxy:2.8-alpine` | `7000:7000` *(Stats)* | **Balanceador TCP L4 de Base de Datos:** Enruta escrituras al puerto 5000 (Primario) con failover automático a la Réplica. |
| **VM-5 (DB Primaria)**| **`db_primary`** | `sig_db_primary` | `postgis/postgis:16-3.4-alpine` | *Interno* (db_net) | Base de datos geoespacial primaria. Volumen `sig_pgdata_primary_volume`. |
| **VM-6 (DB Réplica)** | **`db_replica`** | `sig_db_replica` | `postgis/postgis:16-3.4-alpine` | *Interno* (db_net) | Base de datos réplica standby. Volumen `sig_pgdata_replica_volume`. |
| *(Novedad U2)* | **`prometheus`** | `sig_prometheus` | `prom/prometheus:v2.54.1` | `9090:9090` | Recolección de telemetría y métricas operativas de todos los nodos. |
| *(Novedad U2)* | **`grafana`** | `sig_grafana` | `grafana/grafana:11.2.0` | `3000:3000` | Dashboards preaprovisionados con estado UP/DOWN en tiempo real. |

---

## 3. Despliegue Rápido (Quickstart)

```bash
# 1. Crear variables de entorno
cp .env.example .env

# 2. Desplegar todo el clúster en un solo comando
./scripts/deploy/deploy.sh
# (o mediante docker compose up -d --build)

# 3. Comprobar salud de los 9 contenedores
docker compose ps
```

---

## 4. Accesos y Paneles de Control

- **Plataforma SIG (Aplicación Web):** [http://localhost](http://localhost) (Puerto 80).
- **Estadísticas HAProxy Web (Ingress):** [http://localhost:8404](http://localhost:8404) (o [http://localhost/haproxy?stats](http://localhost/haproxy?stats)).
- **Estadísticas HAProxy Base de Datos:** [http://localhost:7000](http://localhost:7000).
- **Tablero de Monitoreo Grafana:** [http://localhost:3000](http://localhost:3000) (`admin` / `admin_grafana_2026!`).
- **Métricas Prometheus:** [http://localhost:9090](http://localhost:9090).

---

## 5. Pruebas de Resiliencia y Respaldos en Vivo

### A. Demostración de Failover en la Defensa
1. Abre la aplicación en el navegador y el panel de Grafana (`:3000`).
2. Detén intencionalmente el backend primario:
   ```bash
   docker stop sig_backend_1
   ```
3. En Grafana, `backend_1` pasará a rojo (**DOWN**).
4. Refresca la aplicación web: **continúa funcionando al 100%**, ya que `sig_gateway` redirige automáticamente todo el tráfico hacia `sig_backend_2`.
5. Reinicia el nodo: `docker start sig_backend_1`. El clúster recupera el balanceo original.

### B. Respaldos y Restauración de Base de Datos
```bash
# Generar respaldo (pg_dump comprimido con gzip):
./scripts/backup/backup.sh

# Restaurar copia y verificar integridad:
./scripts/restore/restore.sh
```
