# Arquitectura 2 - Sistema de Información Geográfica y Gestión de Sepulturas
## Cementerio General de la Comuna de Los Ángeles
**Autores del Proyecto:** Bryan Ahumada - Johan Muñoz  
**Licitación Mercado Público:** 2411-8-LE25  

---

## 1. Visión General de la Arquitectura 2

La **Arquitectura 2** evoluciona el sistema hacia un modelo modular de alta disponibilidad, tolerancia a fallos y microservicios basados en **Docker**, desacoplado en capas lógicas estrictas para permitir su despliegue distribuido en **Google Cloud Platform (GCP)** o en un entorno de desarrollo local.

```
                         [ USUARIOS / CIUDADANOS / FUNCIONARIOS ]
                                            │
                                            ▼
                                       ( Internet )
                                            │
┌───────────────────────────────────────────┴───────────────────────────────────────────┐
│ CAPA 1: INGRESS / BALANCEO WEB                                                        │
│ [VM 1: vm-1-haproxy-web]                                                              │
│  └─ HAProxy (Balanceador de Carga L7 HTTP/HTTPS - Puerto 80 / 443)                    │
└─────────────────────────────────────┬─────────────────────────────────────────────────┘
                                      │ (Round-Robin / Healthcheck /api/health)
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│ CAPA 2: SERVIDOR APLICACIONES 1       │   │ CAPA 2: SERVIDOR APLICACIONES 2       │
│ [VM 2: vm-2-app-principal]            │   │ [VM 3: vm-3-app-replica]              │
│  ├─ NGINX (Proxy Inverso Web)         │   │  ├─ NGINX (Proxy Inverso Web)         │
│  ├─ Frontend (React + Leaflet)        │   │  ├─ Frontend (React + Leaflet)        │
│  └─ Backend (Python + Flask API REST) │   │  └─ Backend (Python + Flask API REST) │
└───────────────────┬───────────────────┘   └───────────────────┬───────────────────┘
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          │ (Conexión SQL - Puerto 5000)
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ CAPA 3: BALANCEO DE BASE DE DATOS                                                     │
│ [VM 4: vm-4-haproxy-db]                                                               │
│  └─ HAProxy (Balanceador TCP / Enrutador de Conexiones DB)                             │
│     ├─ Puerto 5000: Escritura y Lectura Transaccional -> Enruta a Primario (VM 5)     │
│     └─ Puerto 5001: Lectura Distribuida -> Enruta a Réplica (VM 6) con fallback       │
└─────────────────────────────────────┬─────────────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼ (Escritura/Lectura)                               ▼ (Solo Lectura / Backup)
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│ CAPA 4: BD ALTA DISPONIBILIDAD (PRIM) │   │ CAPA 4: BD ALTA DISPONIBILIDAD (RÉPL) │
│ [VM 5: vm-5-db-primaria]              │   │ [VM 6: vm-6-db-replica]               │
│  ├─ PostgreSQL 16 + PostGIS           │───┼─> PostgreSQL 16 + PostGIS             │
│  └─ Patroni / Replicación Streaming   │   │  └─ Patroni / Read-Only Hot Standby   │
└───────────────────┬───────────────────┘   └───────────────────────────────────────┘
                    │ (pg_dump / WAL Archiving)
                    ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ CAPA 5: RESPALDO DE DATOS AUTOMATIZADO                                                │
│ [VM 7: vm-7-backup-server]                                                            │
│  ├─ Servicio Cron / Docker Backup Automático (pg_dump comprimido)                     │
│  └─ Sincronización a la nube (Google Cloud Storage Bucket - Opcional)                 │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Descripción Detallada de Cada Capa (Top to Bottom)

### Capa 1: Balanceo de Carga Web (Ingress)
- **Máquina Virtual:** `vm-1-haproxy-web`
- **Componente Docker:** `haproxy:2.8-alpine`
- **Función:** Punto único de entrada público. Recibe las solicitudes HTTP/HTTPS de ciudadanos y funcionarios, realiza terminación SSL/TLS (si aplica) y distribuye la carga mediante balanceo Round-Robin hacia las instancias de aplicación de la Capa 2. Monitorea activamente la salud de cada servidor (`/api/health`).

### Capa 2: Servidores de Aplicaciones (Microservicios)
- **Máquinas Virtuales:** `vm-2-app-principal` y `vm-3-app-replica`
- **Componentes Docker por VM:**
  1. **NGINX:** Proxy inverso que sirve la interfaz SPA estática y enruta el prefijo `/api/` hacia el servicio backend local.
  2. **Frontend:** React 18, Vite, Leaflet interactivo con visualización cartográfica de patios y sepulturas, Lucide Icons, diseño moderno responsivo basado en los mockups de la licitación.
  3. **Backend:** Python 3.10 + Flask + Gunicorn + SQLAlchemy + GeoJSON. Implementa la autenticación JWT con roles (Administrador, Funcionario, Público), CRUD de sepulturas, búsqueda multifiltro, gestión de 40 mausoleos emblemáticos y cálculo espacial PostGIS.

### Capa 3: Capa de Balanceo de Base de Datos
- **Máquina Virtual:** `vm-4-haproxy-db`
- **Componente Docker:** `haproxy:2.8-alpine` (modo TCP L4)
- **Función:** Desacopla las aplicaciones del estado físico de las bases de datos.
  - Ofrece el puerto `5000` para transacciones de escritura (enrutadas al nodo Primario `vm-5-db-primaria`).
  - Ofrece el puerto `5001` para consultas de lectura masiva (enrutadas a la réplica `vm-6-db-replica`), aliviando la carga del primario.
  - Si un nodo cae, la aplicación sigue conectándose al mismo endpoint sin cambios de código.

### Capa 4: Base de Datos de Alta Disponibilidad
- **Máquinas Virtuales:**
  - `vm-5-db-primaria`: PostgreSQL 16 con extensión espacial **PostGIS 3.4** habilitada (Lectura y Escritura).
  - `vm-6-db-replica`: PostgreSQL 16 + PostGIS en modo réplica / lectura.
- **Persistencia:** Volúmenes Docker persistentes independientes montados en el host para garantizar supervivencia a reinicios (RNF06).

### Capa 5: Servidor de Respaldo Automatizado
- **Máquina Virtual:** `vm-7-backup-server`
- **Componente Docker:** Contenedor Alpine con cliente `postgresql-client`, `cron` y script `backup.sh`.
- **Función:** Ejecuta respaldos diarios automatizados con `pg_dump`, comprime con `gzip`, mantiene políticas de retención (últimos 7 días) y permite sincronización opcional con Google Cloud Storage (Bucket GCS).

---

## 3. Matriz de Requisitos Funcionales vs Arquitectura

| Requisito | Descripción | Implementación Técnica | Capa / VM |
| :--- | :--- | :--- | :--- |
| **RF01** | Inicio de sesión (correo/usuario y pass) | JWT Tokens con `Flask-JWT-Extended` y `bcrypt` | Capa 2 (Backend) |
| **RF02** | Gestión de roles (admin, funcionario, público) | Middleware decorador `@role_required` | Capa 2 (Backend) |
| **RF03** | Gestión de usuarios internos | Endpoints `/api/users` (CRUD protegido por admin) | Capa 2 (Backend) |
| **RF04** | Registro de sepulturas | Endpoints `/api/sepulturas` con coordenadas | Capa 2 (Backend) + Capa 4 |
| **RF05** | Modificación de sepulturas | PUT `/api/sepulturas/<id>` | Capa 2 + Capa 4 |
| **RF06** | Eliminación o desactivación | Soft delete con flag `is_deleted = true` | Capa 2 + Capa 4 |
| **RF07** | Consulta de sepulturas | GET `/api/sepulturas/<id>` con datos y patio | Capa 2 + Capa 4 |
| **RF08** | Búsqueda multicriterio | Filtros por nombre, apellido, patio, sector | Capa 2 + Capa 4 |
| **RF09** | Ubicación geográfica (coordenadas/geometría) | Tipos espaciales Point/Polygon en PostGIS | Capa 4 (PostGIS) |
| **RF10** | Visualización cartográfica interactiva | Mapas interactivos con Leaflet + GeoJSON | Capa 2 (Frontend) |
| **RF11** | Consulta pública sin login | Rutas públicas `/api/public/...` abiertas | Capa 2 (Backend/Front) |
| **RF12** | Catastro histórico (40 mausoleos emblemáticos) | Módulo `/api/mausoleos` con fotos y reseñas | Capa 2 + Capa 4 |
