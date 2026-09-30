# Plataforma Web y SIG - Cementerio General Comuna de Los Ángeles
## Unidad 1: Despliegue en Máquinas Virtuales en Google Cloud Platform (Sin Docker)
**Licitación Mercado Público:** 2411-8-LE25  
**Autores:** Bryan Ahumada - Johan Muñoz  
**Rama:** `unidad-1`  

---

## 🏛️ Descripción del Proyecto (Unidad 1)

Modernización del sistema de información del Cementerio General de Los Ángeles mediante una plataforma web integrada que unifica la gestión alfanumérica con la visualización geoespacial de sepulturas, actualización topográfica de 5 patios sobre el **recinto real del cementerio** (Camino San Antonio s/n / Av. Gabriela Mistral) y catastro patrimonial de mausoleos emblemáticos.

Para la **Unidad 1**, todos los servicios se ejecutan de forma **nativa sobre el sistema operativo (Debian 12/13)** en 6 Máquinas Virtuales independientes en Google Cloud Compute Engine, prescindiendo del uso de Docker y garantizando **Alta Disponibilidad**, **Failover Automático** y **Cero Pérdida de Datos**.

*(Nota: La versión basada en contenedores Docker se encuentra preservada en la rama `main` para la Unidad 2).*

---

## 🏗️ Topología de Red y Arquitectura por Capas

```
[ INTERNET ]
     │ (Puerto 80 HTTP)
     ▼
[ VM 1: vm-web-haproxy ] (IP Pública: 35.209.139.3 / IP Interna: 10.0.1.10)
     │ 
     │ (Puerto 80 HTTP - Balanceo L7 Round Robin con Healthcheck /api/health)
     ├────────────────────────────────────────┐
     ▼                                        ▼
[ VM 2: vm-app-1 ] (10.0.2.11)             [ VM 3: vm-app-2 ] (10.0.2.12)
(Nginx + React + Flask Gunicorn)           (Nginx + React + Flask Gunicorn)
     │                                        │
     └───────────────────┬────────────────────┘
                         │ (Puerto 5000 TCP - Consultas SQL)
                         ▼
             [ VM 4: vm-db-haproxy ] (10.0.3.10)
             (HAProxy L4 TCP + etcd node-4 + Dashboard :7000)
                         │
                         ├────────────────────────────────────────┐
                         │ (Puerto 5432 SQL Master)               │ (Puerto 5432 SQL Réplica)
                         ▼                                        ▼
             [ VM 5: vm-db-master ] (10.0.3.11)       [ VM 6: vm-db-replica ] (10.0.3.12)
             (PostgreSQL 17 + PostGIS 3.5             (PostgreSQL 17 + PostGIS 3.5
              + Patroni node-5 + etcd node-5)          + Patroni node-6 + etcd node-6)
                         │                                        ▲
                         └──────── WAL Streaming Replication ─────┘
                                  (Lag: 0 MB en tiempo real)
```

---

## 📋 Dimensionamiento de Máquinas Virtuales (GCP - Mínimo Costo)

Todas las instancias fueron dimensionadas en **`us-central1`** bajo el modelo **Spot / Preemptible** para reducir el costo a menos de **$3 USD** por toda la unidad:

| Máquina Virtual | Rol en la Arquitectura | Tipo GCP | vCPU / RAM | Disco | Red VPC | IP Interna |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VM 1: `vm-web-haproxy`** | Balanceador Web Ingress | `e2-micro` | 2 vCPU / 1 GB | 10 GB | `subnet-publica` | `10.0.1.10` (con IP Externa) |
| **VM 2: `vm-app-1`** | Servidor App 1 (Frontend + API) | `e2-small` | 2 vCPU / 2 GB | 15 GB | `subnet-app` | `10.0.2.11` |
| **VM 3: `vm-app-2`** | Servidor App 2 (Réplica App) | `e2-small` | 2 vCPU / 2 GB | 15 GB | `subnet-app` | `10.0.2.12` |
| **VM 4: `vm-db-haproxy`** | Proxy / Árbitro DB | `e2-micro` | 2 vCPU / 1 GB | 10 GB | `subnet-db` | `10.0.3.10` |
| **VM 5: `vm-db-master`** | DB Leader / Patroni | `e2-small` | 2 vCPU / 2 GB | 20 GB | `subnet-db` | `10.0.3.11` |
| **VM 6: `vm-db-replica`** | DB Standby / Patroni | `e2-small` | 2 vCPU / 2 GB | 20 GB | `subnet-db` | `10.0.3.12` |

---

## 🗂️ Estructura del Repositorio (Organizado por VM Independiente)

```
admin-proyecto/
├── docs/                                  # Documentación técnica completa
│   ├── CAPA-DATOS-HA-PATRONI-GCP.md       # Documento exhaustivo del clúster de Base de Datos
│   └── GUIA-GCP-BAJO-COSTO.md             # Guía de optimización de costos en GCP
├── vms/                                   # Configuraciones y Scripts Nativos por VM
│   ├── vm-1-haproxy-web/                  # Capa 1: Ingress Web L7
│   │   ├── haproxy.cfg                    # Balanceador L7 hacia 10.0.2.11 y 10.0.2.12
│   │   └── setup.sh                       # Script de instalación para VM 1
│   ├── vm-2-app-principal/                # Capa 2: Servidor App 1
│   │   ├── nginx.conf                     # Nginx Reverse Proxy
│   │   ├── cementerio-backend.service     # Systemd Service para Gunicorn Flask
│   │   ├── .env                           # Variables de entorno
│   │   └── setup.sh                       # Script de instalación para VM 2
│   ├── vm-3-app-replica/                  # Capa 2: Servidor App 2 (Réplica)
│   │   ├── nginx.conf                     # Nginx Reverse Proxy
│   │   ├── cementerio-backend.service     # Systemd Service para Gunicorn Flask
│   │   ├── .env                           # Variables de entorno
│   │   └── setup.sh                       # Script de instalación para VM 3
│   ├── vm-4-haproxy-db/                   # Capa 3: Proxy Inverso de BD
│   │   ├── haproxy.cfg                    # HAProxy TCP con chequeos HTTP Patroni :8008
│   │   ├── etcd.default                   # Configuración etcd node-4 (Árbitro)
│   │   └── setup.sh                       # Script de instalación para VM 4
│   ├── vm-5-db-primaria/                  # Capa 4: PostgreSQL Master
│   │   ├── config.yml                     # Patroni node-5 config
│   │   ├── etcd.default                   # Configuración etcd node-5
│   │   ├── init.sql                       # Script de creación cementerio_db y postgis
│   │   └── setup.sh                       # Script de instalación para VM 5
│   └── vm-6-db-replica/                   # Capa 4: PostgreSQL Réplica
│       ├── config.yml                     # Patroni node-6 config
│       ├── etcd.default                   # Configuración etcd node-6
│       └── setup.sh                       # Script de instalación para VM 6
├── backend/                               # Código fuente Python Flask API REST
└── frontend/                              # Código fuente React 18 + Leaflet (Google Satélite)
```

---

## ⚡ Guía de Despliegue Rápido en las VMs (Orden Bottom-Up)

El despliegue se realiza **desde la base de datos hacia el balanceador web**:

### 1. Capa de Base de Datos (VM 5, VM 6 y VM 4)
* **En VM 5 (`vm-db-master`):**
  ```bash
  git clone -b unidad-1 https://github.com/Nappie47/admin-proyecto.git
  cd admin-proyecto/vms/vm-5-db-primaria && chmod +x setup.sh && sudo ./setup.sh
  ```
* **En VM 6 (`vm-db-replica`):**
  ```bash
  git clone -b unidad-1 https://github.com/Nappie47/admin-proyecto.git
  cd admin-proyecto/vms/vm-6-db-replica && chmod +x setup.sh && sudo ./setup.sh
  ```
* **En VM 4 (`vm-db-haproxy`):**
  ```bash
  git clone -b unidad-1 https://github.com/Nappie47/admin-proyecto.git
  cd admin-proyecto/vms/vm-4-haproxy-db && chmod +x setup.sh && sudo ./setup.sh
  ```

### 2. Capa de Aplicación (VM 2 y VM 3)
* **En VM 2 (`vm-app-1`):**
  ```bash
  git clone -b unidad-1 https://github.com/Nappie47/admin-proyecto.git
  cd admin-proyecto/vms/vm-2-app-principal && chmod +x setup.sh && sudo ./setup.sh
  ```
* **En VM 3 (`vm-app-2`):**
  ```bash
  git clone -b unidad-1 https://github.com/Nappie47/admin-proyecto.git
  cd admin-proyecto/vms/vm-3-app-replica && chmod +x setup.sh && sudo ./setup.sh
  ```

### 3. Capa Web Ingress (VM 1)
* **En VM 1 (`vm-web-haproxy`):**
  ```bash
  git clone -b unidad-1 https://github.com/Nappie47/admin-proyecto.git
  cd admin-proyecto/vms/vm-1-haproxy-web && chmod +x setup.sh && sudo ./setup.sh
  ```

---

## 🌐 URLs de Acceso y Credenciales

* **Portal Web Público (Ingress HAProxy):** `http://35.209.139.3`
* **Estadísticas de Tráfico Web:** `http://35.209.139.3/haproxy?stats`
* **Estadísticas de Tráfico Base de Datos:** `http://10.0.3.10:7000` (o mediante su IP pública temporal)

### Credenciales del Sistema:
* **Administrador General:** `admin@losangeles.cl` / `Admin123!`
* **Funcionario Catastro:** `funcionario@losangeles.cl` / `Funcionario123!`
* **Técnico Terreno:** `terreno@losangeles.cl` / `Terreno123!`
* **Base de Datos PostgreSQL:** Usuario `app_user` / Contraseña `AppPassword123!` / DB `cementerio_db`
