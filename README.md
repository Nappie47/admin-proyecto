# Sistema de Información Geográfica - Cementerio General de Los Ángeles
## Administración de Redes y Servidores - Unidad 1

**Integrantes:**
- Bryan Ahumada
- Johan Muñoz

---

## Descripción del Proyecto

Este proyecto consiste en el desarrollo e implementación de un Sistema de Información Geográfica (SIG) y plataforma de gestión para el Cementerio General de la Comuna de Los Ángeles. Permite la administración de registros de sepulturas, catastro patrimonial de mausoleos y la delimitación cartográfica interactiva de sectores y patios sobre imágenes satelitales.

Para esta Unidad 1, el sistema está desplegado de forma nativa sobre máquinas virtuales con sistema operativo Debian 13 en Google Cloud Platform, implementando alta disponibilidad tanto a nivel de aplicación como en la base de datos sin utilizar contenedores.

---

## Arquitectura de Servidores (GCP)

La infraestructura se compone de 6 máquinas virtuales distribuidas en tres redes privadas conectadas mediante VPC Peering:

| Máquina Virtual | IP Interna | Rol / Servicio Principal |
| :--- | :--- | :--- |
| **vm-web-haproxy** | `10.0.1.10` | Balanceador de carga web L7 (HAProxy) con IP pública. |
| **vm-app-1** | `10.0.2.11` | Servidor de aplicación principal (Nginx, React 18, Flask API, Gunicorn). |
| **vm-app-2** | `10.0.2.12` | Servidor de aplicación réplica (Nginx, React 18, Flask API, Gunicorn). |
| **vm-db-haproxy** | `10.0.3.10` | Enrutador TCP (HAProxy) a la base de datos y nodo árbitro de etcd. |
| **vm-db-master** | `10.0.3.11` | Base de datos primaria (PostgreSQL 17, PostGIS 3.5, Patroni, etcd). |
| **vm-db-replica** | `10.0.3.12` | Base de datos réplica standby con auto-promoción (Patroni, etcd). |

---

## Tecnologías Utilizadas

- **Sistema Operativo:** Debian 13 (Trixie) GNU/Linux.
- **Frontend:** React 18, Vite, Leaflet, Google Maps API.
- **Backend:** Python 3.13, Flask, SQLAlchemy, Gunicorn.
- **Base de Datos Espacial:** PostgreSQL 17 + PostGIS 3.5.
- **Alta Disponibilidad y Failover:** Patroni 3.x, etcd 3.5.
- **Balanceo y Proxy:** HAProxy 2.8, Nginx.
- **Autenticación:** JWT (JSON Web Tokens) con contraseñas encriptadas en bcrypt.

---

## Estructura del Repositorio

```text
├── backend/            # Código fuente de la API REST en Flask y modelos ORM
│   ├── models/         # Modelos de base de datos (Usuario, Sepultura, Patio, Mausoleo)
│   ├── routes/         # Endpoints de la API (auth, sepulturas, patios, mausoleos)
│   └── tests/          # Pruebas unitarias de la API
├── frontend/           # Aplicación web SPA en React
│   └── src/            # Componentes, vistas y servicios de conexión
└── vms/                # Archivos de configuración de los servicios para cada VM
    ├── vm-1-haproxy-web/
    ├── vm-2-app-principal/
    ├── vm-3-app-replica/
    ├── vm-4-haproxy-db/
    ├── vm-5-db-primaria/
    └── vm-6-db-replica/
```

---

## Despliegue y Comandos de Servicio

Cada servicio se ejecuta de manera nativa mediante `systemd`:

- **En servidores de aplicación (VM 2 y VM 3):**
  ```bash
  sudo systemctl status cementerio-backend
  sudo systemctl status nginx
  ```

- **En el balanceador de base de datos (VM 4):**
  ```bash
  sudo systemctl status haproxy
  sudo systemctl status etcd
  ```

- **En los nodos de base de datos (VM 5 y VM 6):**
  ```bash
  sudo systemctl status patroni
  # Ver estado del clúster de base de datos
  patronictl -c /etc/patroni/config.yml list
  ```
