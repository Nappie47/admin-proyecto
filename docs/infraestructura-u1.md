# Infraestructura y Servicios de la Unidad 1
## Sistema de Información Geográfica - Cementerio General de Los Ángeles
**Autores:** Bryan Ahumada - Johan Muñoz  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Profesor:** Ricardo Pérez  

---

## 1. Visión General de la Unidad 1

En la Unidad 1 del proyecto integrador, la solución se diseñó e implementó de manera nativa sobre **Google Cloud Platform (GCP)** utilizando un clúster de **6 Máquinas Virtuales** con sistema operativo **Debian 13 (Trixie) GNU/Linux**, gestionadas enteramente bajo demonios de **systemd** sin el uso de contenedores.

El objetivo fue asegurar una infraestructura de alta disponibilidad (HA), segmentación de redes y tolerancia a fallos tanto en la capa web/aplicación como en la persistencia de datos.

---

## 2. Inventario de Servidores y Segmentación de Red

La arquitectura de red de la Unidad 1 se distribuyó en 3 redes privadas virtuales (VPC) independientes, interconectadas mediante **VPC Network Peering**:

```
[ USUARIOS / INTERNET ]
           │
           ▼ (Puerto 80 HTTP)
┌────────────────────────────────────────────────────────┐
│ VPC 1: Subnet Pública (10.0.1.0/24)                    │
│ • VM 1: vm-web-haproxy (IP Privada: 10.0.1.10)         │
│   IP Pública: 35.209.139.3                             │
│   Rol: Ingress L7, Balanceo Round-Robin hacia VM 2 y 3 │
└──────────────────────────┬─────────────────────────────┘
                           │ (VPC Peering 1 <-> 2)
┌──────────────────────────┴─────────────────────────────┐
│ VPC 2: Subnet Aplicación (10.0.2.0/24)                 │
│ • VM 2: vm-app-1 (10.0.2.11)                          │
│   Nginx + React 18 SPA + Flask Gunicorn (Python 3.13)  │
│ • VM 3: vm-app-2 (10.0.2.12)                          │
│   Nginx + React 18 SPA + Flask Gunicorn (Python 3.13)  │
└──────────────────────────┬─────────────────────────────┘
                           │ (VPC Peering 2 <-> 3)
┌──────────────────────────┴─────────────────────────────┐
│ VPC 3: Subnet Base de Datos (10.0.3.0/24)              │
│ • VM 4: vm-db-haproxy (10.0.3.10)                      │
│   HAProxy TCP L4 (5000/5001) + Árbitro etcd (Quórum)   │
│ • VM 5: vm-db-master (10.0.3.11)                       │
│   PostgreSQL 17 + PostGIS 3.5 + Patroni Leader + etcd  │
│ • VM 6: vm-db-replica (10.0.3.12)                      │
│   PostgreSQL 17 + PostGIS 3.5 + Patroni Standby + etcd │
└────────────────────────────────────────────────────────┘
```

### Tabla de Roles y Direccionamiento

| Máquina Virtual | IP Interna | Especificación GCP | Rol y Servicios Systemd |
| :--- | :--- | :--- | :--- |
| **vm-web-haproxy** | `10.0.1.10` | e2-micro | Balanceador de Carga L7 (HAProxy). Expone IP pública. Enruta `/` y `/api/` hacia `vm-app-1` y `vm-app-2` con algoritmo Round-Robin y verificación activa de `/api/health`. |
| **vm-app-1** | `10.0.2.11` | e2-medium | Servidor de Aplicación Primario. Corre `nginx` para servir los estáticos compilados de React 18 y el servicio `cementerio-backend.service` (Gunicorn + Flask). |
| **vm-app-2** | `10.0.2.12` | e2-medium | Servidor de Aplicación Réplica. Idéntica configuración que VM-2, ofreciendo redundancia activa-activa ante caídas. |
| **vm-db-haproxy** | `10.0.3.10` | e2-micro | Balanceador TCP L4 para Base de Datos y 3er nodo árbitro del clúster `etcd`. Enruta escrituras al puerto 5000 (nodo líder de Patroni) y lecturas al puerto 5001. |
| **vm-db-master** | `10.0.3.11` | e2-medium | Base de Datos Primaria con PostgreSQL 17, PostGIS 3.5, `patroni.service` y miembro de `etcd`. Gestiona la inicialización de esquemas espaciales. |
| **vm-db-replica** | `10.0.3.12` | e2-medium | Base de Datos Réplica (Standby en streaming replication). Administrada por `patroni.service` para auto-promoción automática si el líder cae. |

---

## 3. Servicios Base y Operación en Unidad 1

### A. Acceso Remoto Seguro
- Conexión exclusivamente mediante llaves SSH criptográficas (ed25519) inyectadas a través de los metadatos de GCP.
- Reglas de firewall de GCP que aíslan las subredes de aplicación y base de datos, impidiendo el acceso directo desde internet.

### B. Alta Disponibilidad de Base de Datos (Patroni + etcd)
- Patroni consulta constantemente el Distributed Configuration Store (DCS) provisto por `etcd` distribuido entre VM 4, VM 5 y VM 6 (3 nodos para evitar split-brain).
- El estado del clúster se monitoreaba mediante:
  ```bash
  patronictl -c /etc/patroni/config.yml list
  ```
- HAProxy L4 en VM 4 consultaba el endpoint HTTP de Patroni (`:8008/primary`) para dirigir el tráfico de escritura siempre al nodo que ostentaba el rol de líder.

### C. Archivos de Configuración Preservados
Todas las configuraciones originales (`setup.sh`, archivos `.service` de systemd, `haproxy.cfg`, `config.yml` de Patroni) han sido archivadas en la carpeta `infrastructure/vm-notes/` del repositorio, manteniendo la trazabilidad histórica exigida por la asignatura.

