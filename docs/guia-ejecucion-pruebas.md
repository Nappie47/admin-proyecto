# Guía de Ejecución, Operación y Batería de Pruebas
## Sistema de Información Geográfica (SIG) - Cementerio General de Los Ángeles
**Proyecto Integrador Unidad 2 - Alta Disponibilidad en Contenedores**  
**Autores:** Bryan Ahumada - Johan Muñoz  
**Asignatura:** Administración de Redes y Sistemas Computacionales  

---

## 1. Inventario y Ficha Técnica de Contenedores

La arquitectura cuenta con **9 contenedores** orquestados, cada uno con una responsabilidad única, puertos asignados y equivalencia con la Unidad 1:

| # | Contenedor (`container_name`) | Servicio Compose | Imagen Base | Puertos Expuestos | Redes Docker | Volúmenes Montados | Health Check | Equivalencia U1 |
| :-: | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **1** | **`sig_gateway`** | `gateway` | `haproxy:2.8-alpine` | `80:80`<br>`8404:8404` | `frontend_net`<br>`backend_net`<br>`monitoring_net` | Ninguno (Stateless) | `wget -q --spider :8404/` (15s) | **VM-1: vm-web-haproxy** (Ingress L7) |
| **2** | **`sig_frontend_1`** | `frontend_1` | `node:20-alpine` + `nginx-unprivileged` | *Interno* (:8080) | `frontend_net` | Ninguno (Stateless) | `wget -q :8080/health` (20s) | **VM-2: vm-app-1** (Web Nginx) |
| **3** | **`sig_frontend_2`** | `frontend_2` | `node:20-alpine` + `nginx-unprivileged` | *Interno* (:8080) | `frontend_net` | Ninguno (Stateless) | `wget -q :8080/health` (20s) | **VM-3: vm-app-2** (Web Réplica) |
| **4** | **`sig_backend_1`** | `backend_1` | `python:3.11-slim` + Gunicorn (3w) | *Interno* (:5000) | `backend_net`<br>`db_net` | Ninguno (Stateless) | `curl -f :5000/api/health` (15s) | **VM-2: vm-app-1** (API Flask) |
| **5** | **`sig_backend_2`** | `backend_2` | `python:3.11-slim` + Gunicorn (3w) | *Interno* (:5000) | `backend_net`<br>`db_net` | Ninguno (Stateless) | `curl -f :5000/api/health` (15s) | **VM-3: vm-app-2** (API Réplica) |
| **6** | **`sig_haproxy_db`** | `haproxy_db` | `haproxy:2.8-alpine` (Modo TCP) | `7070:7000` *(Stats)*<br>*Interno :5000 / :5001* | `db_net`<br>`monitoring_net` | `./infrastructure/proxy/haproxy-db.cfg` | `wget -q --spider :7000/` (10s) | **VM-4: vm-db-haproxy** (Enrutador TCP) |
| **7** | **`sig_db_primary`** | `db_primary` | `postgis/postgis:16-3.4-alpine` | *Interno* (:5432) | `db_net` (*internal: true*) | `sig_pgdata_primary_volume`<br>`init/01-init-postgis.sql` | `pg_isready -U postgres` (10s) | **VM-5: vm-db-master** (PostGIS Primario) |
| **8** | **`sig_db_replica`** | `db_replica` | `postgis/postgis:16-3.4-alpine` | *Interno* (:5432) | `db_net` (*internal: true*) | `sig_pgdata_replica_volume`<br>`init/01-init-postgis.sql` | `pg_isready -U postgres` (10s) | **VM-6: vm-db-replica** (PostGIS Standby) |
| **9** | **`sig_prometheus`** | `prometheus` | `prom/prometheus:v2.54.1` | `9090:9090` | `monitoring_net`<br>`backend_net` | `sig_prometheus_data`<br>`prometheus.yml` | `wget -q :9090/-/healthy` (20s) | *(Novedad U2)* Recolector de Métricas |
| **10**| **`sig_grafana`** | `grafana` | `grafana/grafana:11.2.0` | `3000:3000` | `monitoring_net` | `sig_grafana_data`<br>`provisioning/` | Interno de Grafana | *(Novedad U2)* Dashboard de Observabilidad |

---

## 2. Guía de Ejecución Rápida

### Paso 1: Clonar y Preparar el Archivo de Entorno
```bash
# Ubicarse en la rama unidad-2
git checkout unidad-2

# Crear archivo .env a partir de la plantilla
cp .env.example .env
```

### Paso 2: Despliegue Automatizado
Puedes usar el script integrado:
```bash
./scripts/deploy/deploy.sh
```
O el comando directo de Docker Compose:
```bash
docker compose up -d --build
```

### Paso 3: Verificar el Estado de Salud de Todos los Nodos
```bash
docker compose ps
```
*Todos los contenedores deben figurar en estado `Up` y `(healthy)`.*

---

## 3. URLs y Credenciales de Acceso

| Servicio | URL de Acceso | Credenciales por Defecto |
| :--- | :--- | :--- |
| **Plataforma Web SIG** | [http://localhost](http://localhost) (Puerto 80) | Ciudadano: Acceso libre sin login<br>Admin: `admin@losangeles.cl` / `Admin123!`<br>Funcionario: `funcionario@losangeles.cl` / `Funcionario123!` |
| **Estadísticas HAProxy Web** | [http://localhost:8404](http://localhost:8404) | Sin credenciales (Acceso directo a métricas L7) |
| **Estadísticas HAProxy DB** | [http://localhost:7070](http://localhost:7070) | Sin credenciales (Conexiones TCP PostgreSQL) |
| **Dashboard Grafana** | [http://localhost:3000](http://localhost:3000) | Usuario: `admin`<br>Clave: `admin_grafana_2026!` |
| **Métricas Prometheus** | [http://localhost:9090](http://localhost:9090) | Sin credenciales |

---

## 4. Batería de Pruebas para la Defensa (Paso a Paso)

Estas pruebas están diseñadas para ejecutarse en vivo frente al evaluador, demostrando el cumplimiento del 100% de la rúbrica:

### Prueba 1: Navegación, Búsqueda y Precarga de Datos (Operación Normal)
1. Abrir en el navegador: [http://localhost](http://localhost)
2. **Validar:** Se carga el mapa interactivo satelital con los 5 patios del Cementerio General de Los Ángeles.
3. Ir al buscador e ingresar el apellido `Pérez`.
4. **Validar:** Aparece la ficha de "Juan Pérez González", con fecha de defunción, número de sepultura 104 y ubicación geográfica en el Patio 2.
5. Ir a la sección de Mausoleos:
6. **Validar:** Se despliegan los 40 mausoleos históricos con sus fotos y reseñas patrimoniales.

---

### Prueba 2: Demostración de Tolerancia a Fallos en el Backend (Failover de API)
*Objetivo: Demostrar que si la instancia principal de la API se destruye, el sistema no sufre ninguna caída.*

1. Abrir el dashboard de HAProxy Web en una pestaña: [http://localhost:8404](http://localhost:8404)  
   *(Observarás que `backend_1` y `backend_2` están en verde).*
2. En la terminal, apagar deliberadamente el backend primario:
   ```bash
   docker stop sig_backend_1
   ```
3. En la pestaña de HAProxy (`:8404`), en pocos segundos verás que `backend_1` cambia a color rojo (**DOWN**).
4. Volver a la aplicación web [http://localhost](http://localhost) y hacer una búsqueda de sepultura o navegar por los patios:
   - **Resultado Esperado:** **La página sigue funcionando al 100% de manera inmediata.** HAProxy redirigió todas las peticiones a `sig_backend_2`. Cero interrupción para el usuario.
5. Volver a encender el contenedor:
   ```bash
   docker start sig_backend_1
   ```
6. En HAProxy (`:8404`), el nodo vuelve a verde automáticamente y se reanuda el balanceo Round-Robin.

---

### Prueba 3: Demostración de Tolerancia a Fallos en el Frontend (Failover Web)
*Objetivo: Demostrar que si el servidor web primario se cae, la interfaz sigue visible.*

1. En la terminal, detener el contenedor del Frontend 1:
   ```bash
   docker stop sig_frontend_1
   ```
2. Refrescar la página [http://localhost](http://localhost):
   - **Resultado Esperado:** La página carga perfectamente desde `sig_frontend_2`.
3. Reactivar el nodo:
   ```bash
   docker start sig_frontend_1
   ```

---

### Prueba 4: Demostración de Failover en la Capa de Datos (HAProxy DB)
*Objetivo: Demostrar que el balanceador TCP desacopla las aplicaciones del estado de la base de datos.*

1. Abrir el panel de estadísticas de la base de datos: [http://localhost:7070](http://localhost:7070)
2. Observarás:
   - `db_primary`: En color verde activo (recibiendo escrituras en puerto 5000).
   - `db_replica`: En color azul (`backup` listo para asumir la carga).
3. Detener la base de datos primaria:
   ```bash
   docker stop sig_db_primary
   ```
4. En el puerto 7070, `db_replica` asume el tráfico de inmediato.
5. Reactivar:
   ```bash
   docker start sig_db_primary
   ```

---

### Prueba 5: Respaldo Automatizado y Simulación de Recuperación ante Desastres (Restore)
*Objetivo: Demostrar la resiliencia y continuidad de negocio exigida en el Aspecto 4 de la rúbrica.*

1. **Generar una copia de seguridad en caliente:**
   ```bash
   ./scripts/backup/backup.sh
   ```
   *Salida esperada:* Creación del archivo comprimido `backups/cementerio_db_YYYYMMDD_HHMMSS.sql.gz`.
2. **Simular desastre o alteración:**
   Entrar a la base de datos y simular una pérdida de datos:
   ```bash
   docker exec -i sig_db_primary psql -U postgres -d cementerio_db -c "DELETE FROM sepulturas WHERE numero = '104';"
   ```
   *(Si buscas en la web a "Juan Pérez", ya no aparecerá).*
3. **Ejecutar la restauración ante desastres:**
   ```bash
   ./scripts/restore/restore.sh
   ```
   Confirmar con `s`.
4. **Validación:**
   El script restaura el volcado y ejecuta la comprobación de integridad en vivo:
   ```text
      tabla    | registros 
   ------------+-----------
    Patios     |         5
    Sepulturas |        15
    Mausoleos  |        40
    Usuarios   |         3
   ```
   Al refrescar la web, la sepultura 104 está recuperada al 100%.

---

### Prueba 6: Observabilidad y Métricas en Grafana
1. Abrir Grafana en [http://localhost:3000](http://localhost:3000)
2. Iniciar sesión con `admin` / `admin_grafana_2026!`.
3. Ir al menú **Dashboards** -> Abrir **"SIG Cementerio Los Ángeles - Monitoreo de Servicios"**.
4. **Validar:**
   - Visualización de indicadores `UP` (verde) para todos los servicios (`gateway`, `backend_1`, `backend_2`, `haproxy_db`, `prometheus`).
   - Gráfico de series de tiempo con latencias de respuesta en segundos.

---

## 5. Comandos Frecuentes de Diagnóstico y Operación

```bash
# Ver logs en tiempo real de un servicio específico
docker compose logs -f gateway
docker compose logs -f backend_1
docker compose logs -f haproxy_db

# Reiniciar un contenedor problemático
docker compose restart backend_1

# Detener todo el clúster sin perder datos (volúmenes se conservan)
docker compose down

# Destruir todo incluyendo volúmenes (¡ATENCIÓN: BORRA LOS DATOS DE BD!)
docker compose down -v
```

