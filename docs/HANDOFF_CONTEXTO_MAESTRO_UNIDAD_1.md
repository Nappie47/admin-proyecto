# 📋 DOCUMENTO MAESTRO DE CONTEXTO TÉCNICO Y TRASPASO
## Proyecto: Sistema de Información Geográfica (SIG) - Cementerio General de Los Ángeles
**Autores:** Johan Muñoz - Bryan Ahumada  
**Entorno:** Google Cloud Platform (GCP) — Compute Engine  
**Rama Activa de Trabajo:** `unidad-1`  
**Repositorio GitHub:** `https://github.com/Nappie47/admin-proyecto.git`  

---

> 💡 **PARA OTROS COLABORADORES O CHATS DE IA:**  
> Este documento contiene **todo el historial, arquitectura, decisiones técnicas, credenciales, comandos y estado actual del proyecto**. Si vas a iniciar un chat con otra IA (ChatGPT, Claude, Gemini, Cursor, etc.), copia y pega el bloque al final de este archivo para que la IA entienda el 100% del proyecto de inmediato.

---

## 1. Contexto General y Reglas del Proyecto

1. **Objetivo del Proyecto:** Plataforma SIG catastral para el Cementerio General de la Comuna de Los Ángeles (Región del Biobío, Chile). Ubicación real: Camino San Antonio s/n / Av. Gabriela Mistral (Coords: `-37.4732, -72.3229`).
2. **Diferencia Crítica entre Unidades Académicas:**
   - **Rama `main` (Unidad 2):** Arquitectura basada en **contenedores Docker** y microservicios. **NO TOCAR PARA LA UNIDAD 1**.
   - **Rama `unidad-1` (Unidad 1):** Arquitectura de Alta Disponibilidad **100% NATIVA sobre Debian 13 GNU/Linux, ESTRICTAMENTE SIN DOCKER**. Todos los procesos corren bajo demonios nativos de `systemd` (`nginx`, `cementerio-backend`, `haproxy`, `patroni`, `etcd`, `postgresql@17-main`).

---

## 2. Inventario de Infraestructura en Google Cloud (6 VMs)

La infraestructura está distribuida en **3 Redes VPC independientes** interconectadas mediante **VPC Network Peering**:

```
[ INTERNET PÚBLICO ]
         │
         ▼ (Puerto 80 HTTP)
┌────────────────────────────────────────────────────────┐
│ VPC 1: subnet-publica (10.0.1.0/24)                    │
│ • VM 1: vm-web-haproxy (Privada: 10.0.1.10)           │
│   IP Pública: 35.209.139.3                             │
│   Rol: Ingress L7, Balanceo Round-Robin hacia VM 2 y 3 │
└──────────────────────────┬─────────────────────────────┘
                           │ (VPC Peering 1 <-> 2)
┌──────────────────────────┴─────────────────────────────┐
│ VPC 2: subnet-app (10.0.2.0/24)                        │
│ • VM 2: vm-app-1 (10.0.2.11)                          │
│   Nginx + React 18 SPA + Flask Gunicorn (Python 3.13)  │
│ • VM 3: vm-app-2 (10.0.2.12)                          │
│   Nginx + React 18 SPA + Flask Gunicorn (Python 3.13)  │
└──────────────────────────┬─────────────────────────────┘
                           │ (VPC Peering 2 <-> 3)
┌──────────────────────────┴─────────────────────────────┐
│ VPC 3: subnet-db (10.0.3.0/24 - Alta Disponibilidad)   │
│ • VM 4: vm-db-haproxy (10.0.3.10)                      │
│   HAProxy TCP (Pto 5000 Write, 5001 Read) + etcd node-4│
│ • VM 5: vm-db-master (10.0.3.11)                       │
│   PostgreSQL 17 + PostGIS 3.5 + Patroni node-5 + etcd  │
│ • VM 6: vm-db-replica (10.0.3.12)                      │
│   PostgreSQL 17 + PostGIS 3.5 + Patroni node-6 + etcd  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Matriz de Direcciones IP, Puertos y Credenciales

| Componente | VM / Nombre GCP | IP Privada | IP Pública | Puertos / Servicios | Credenciales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Balanceador Web** | `vm-web-haproxy` | `10.0.1.10` | `35.209.139.3` | • `80` (HTTP Ingress)<br>• `/haproxy?stats` | Acceso público sin contraseña |
| **App 1** | `vm-app-1` | `10.0.2.11` | Opcional | • `80` (Nginx)<br>• `5000` (Flask backend) | SSH via GCP |
| **App 2** | `vm-app-2` | `10.0.2.12` | Opcional | • `80` (Nginx)<br>• `5000` (Flask backend) | SSH via GCP |
| **Router DB & Árbitro** | `vm-db-haproxy` | `10.0.3.10` | Ninguna | • `5000` (SQL Write)<br>• `5001` (SQL Read)<br>• `7000` (HAProxy Stats)<br>• `2379/2380` (etcd) | **Dashboard :7000:** `admin` / `AdminPass123!` |
| **DB Primaria / Patroni** | `vm-db-master` | `10.0.3.11` | Ninguna | • `5432` (PostgreSQL)<br>• `8008` (Patroni REST)<br>• `2379/2380` (etcd) | **PostgreSQL:** User: `app_user` / Pass: `AppPassword123!` / DB: `cementerio_db` |
| **DB Réplica / Patroni** | `vm-db-replica` | `10.0.3.12` | Ninguna | • `5432` (PostgreSQL)<br>• `8008` (Patroni REST)<br>• `2379/2380` (etcd) | Replicación física automática |

### Credenciales de Usuario de la Aplicación Web:
- **Usuario Administrador:** `admin@losangeles.cl`
- **Contraseña:** `Admin123!`
- **Usuario Funcionario:** `funcionario@losangeles.cl` / `Funcionario123!`
- **Usuario Terreno:** `terreno@losangeles.cl` / `Terreno123!`

---

## 4. Cómo Opera la Alta Disponibilidad (HA) y Failover

### A. Capa de Aplicaciones (VM 2 y VM 3)
- El ingress en `vm-web-haproxy` monitorea constantemente `http://10.0.2.11/api/health` y `http://10.0.2.12/api/health`.
- Si una de las dos VMs de aplicación cae o se reinicia, el 100% de las peticiones de los usuarios se dirigen automáticamente a la otra máquina.

### B. Capa de Datos (VM 4, VM 5 y VM 6)
- **Desacoplamiento de IP:** Las aplicaciones conectan su cadena SQLAlchemy a:
  `postgresql://app_user:AppPassword123!@10.0.3.10:5000/cementerio_db`
- **HAProxy en VM 4 (`10.0.3.10`):** Realiza un sondeo HTTP cada 2 segundos a `http://<ip-nodo>:8008/primary` (API de Patroni). Solo el nodo que actualmente sea Líder responde `200 OK`; la réplica responde `503 Service Unavailable`.
- **Clúster de Consenso Raft (`etcd` 3 nodos):**
  - Nodo 4 en `10.0.3.10` (VM 4 - Árbitro).
  - Nodo 5 en `10.0.3.11` (VM 5).
  - Nodo 6 en `10.0.3.12` (VM 6).
  Garantiza quórum impar de 3 nodos para evitar *Split-Brain*.
- **Prueba de Failover Realizada:**
  Al apagar VM 5 (`vm-db-master`), Patroni en VM 6 detectó la pérdida de TTL en etcd (< 10 s), promovió automáticamente a VM 6 como Líder de Lectura/Escritura, y HAProxy derivó todas las escrituras a `10.0.3.12` con 0 segundos de intervención manual. Al encender VM 5, se reincorporó como réplica con 0 MB de lag.

---

## 5. Frontend y Editor Interactivo de Patios SIG

- **Ubicación en la Web:** En la barra de navegación superior existe el botón **`Editor de Patios SIG`** y la pestaña **`Mapa`**.
- **Funcionalidad:**
  - Permite dibujar polígonos interactivos sobre la imagen satelital híbrida de Google Maps.
  - Al hacer clic en **`+ Crear Patio`** o **`Editar Límites`**, el cursor se transforma en mira (`crosshair`) y cada clic en el mapa añade un vértice `[lat, lng]` al polígono.
  - Permite ingresar: número de patio, nombre, descripción, superficie en $m^2$ y color.
  - Botón **`Guardar en DB (10.0.3.10:5000)`**: envía un `POST` o `PUT` a `/api/patios`, escribiendo directamente en PostgreSQL a través de HAProxy.
  - Botón **`Poblar 5 Patios & Admin en DB`**: ejecuta un bootstrap automático que inserta los 5 patios oficiales de Los Ángeles, el usuario administrador y 75 sepulturas de muestra.

---

## 6. Procedimiento para Desplegar Cambios en las VMs (VM 2 y VM 3)

Si se realizan cambios en el repositorio GitHub, ejecutar en **`vm-app-1`** y **`vm-app-2`**:

```bash
# 1. Ingresar como root (o con sudo)
sudo -i

# 2. Ir a la carpeta del repositorio y actualizar la rama unidad-1
cd /root/admin-proyecto
git reset --hard
git pull origin unidad-1

# 3. Actualizar Backend Flask y reiniciar servicio nativo
cp -r backend/* /var/www/cementerio-backend/
systemctl restart cementerio-backend

# 4. Compilar Frontend React y publicar en Nginx
cd /root/admin-proyecto/frontend
npm install
npm run build
rm -rf /var/www/cementerio-frontend/*
cp -r dist/* /var/www/cementerio-frontend/
systemctl reload nginx

# 5. Probar salud local
curl http://127.0.0.1/api/health
```

---

## 7. Comandos de Diagnóstico Rápido

- **Ver estado del clúster de base de datos (en VM 4, 5 o 6):**
  ```bash
  patronictl -c /etc/patroni/config.yml list
  ```
- **Ver salud de etcd (en VM 4):**
  ```bash
  etcdctl --endpoints=http://10.0.3.10:2379,http://10.0.3.11:2379,http://10.0.3.12:2379 endpoint health
  ```
- **Ver estadísticas de HAProxy DB (en el navegador):**
  `http://<IP-VM-4>:7000` (Usuario: `admin` / Contraseña: `AdminPass123!`).
- **Ver estadísticas de HAProxy Web (en el navegador):**
  `http://35.209.139.3/haproxy?stats`
- **Ver logs del backend:**
  ```bash
  journalctl -u cementerio-backend -f -n 50
  ```
- **Poblar la base de datos por consola:**
  ```bash
  curl -X POST http://127.0.0.1/api/patios/bootstrap
  ```

---

## 8. PROMPT MAESTRO PARA COPIAR A OTRO CHAT DE IA

*(Copia el siguiente bloque y pégalo en un nuevo chat de ChatGPT, Claude, Gemini o cualquier otra IA para darle el contexto completo del proyecto):*

```markdown
Hola. Estoy trabajando como desarrollador en un proyecto universitario de software y te comparto el contexto técnico completo para que me asistas:

### CONTEXTO DEL PROYECTO:
- Sistema: SIG y Gestión Catastral del Cementerio General de Los Ángeles (Chile).
- Ubicación real: Camino San Antonio s/n / Av. Gabriela Mistral (Lat: -37.4732, Lon: -72.3229).
- Repositorio GitHub: https://github.com/Nappie47/admin-proyecto.git
- Rama activa: "unidad-1" (Importante: la rama "main" tiene Docker para la Unidad 2, pero en "unidad-1" estamos trabajando de forma ESTRICTAMENTE NATIVA en Debian 13 GNU/Linux, SIN DOCKER).

### INFRAESTRUCTURA EN GOOGLE CLOUD (6 MÁQUINAS VIRTUALES):
1. VM 1 (vm-web-haproxy - IP Pública: 35.209.139.3, Privada: 10.0.1.10): Ingress L7 HAProxy en puerto 80 que balancea mediante Round-Robin hacia VM 2 y VM 3 con health check en /api/health.
2. VM 2 (vm-app-1 - 10.0.2.11) y VM 3 (vm-app-2 - 10.0.2.12): Servidores de aplicaciones redundantes con Nginx (puerto 80) sirviendo una SPA React 18 + Leaflet satelital, y servicio systemd cementerio-backend con Gunicorn + Flask API REST (Python 3.13) en puerto 5000. Cuentan con un Editor Visual de Patios SIG.
3. VM 4 (vm-db-haproxy - 10.0.3.10): Balanceador TCP L4 que expone el puerto 5000 para transacciones de escritura SQL y puerto 5001 para lectura. Además aloja el nodo árbitro de etcd (node-4) para lograr quórum impar de 3 nodos.
4. VM 5 (vm-db-master - 10.0.3.11) y VM 6 (vm-db-replica - 10.0.3.12): Clúster de PostgreSQL 17 + PostGIS 3.5 administrado por Patroni 3.x y etcd 3.5 con replicación física de streaming WAL y failover automático en menos de 10 segundos.

### BASE DE DATOS Y CONEXIÓN:
- Cadena de conexión de las apps: postgresql://app_user:AppPassword123!@10.0.3.10:5000/cementerio_db
- HAProxy enruta el puerto 5000 dinámicamente al Líder activo consultando el endpoint HTTP /primary de Patroni en puerto 8008.
- Usuario admin del sistema web: admin@losangeles.cl / Admin123!

Por favor, actúa como el arquitecto y desarrollador senior de este proyecto, manteniendo siempre la compatibilidad nativa en Debian 13 sin Docker para la rama unidad-1.
```
