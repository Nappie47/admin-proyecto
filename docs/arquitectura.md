# Arquitectura de Contenedores y Microservicios - Unidad 2
## Sistema de Información Geográfica - Cementerio General de Los Ángeles
**Autores:** Bryan Ahumada - Johan Muñoz  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Licitación Mercado Público:** 2411-8-LE25  

---

## 1. Evolución Técnica desde la Unidad 1

La Unidad 2 representa una **evolución tecnológica directa** respecto a la infraestructura bare-metal/VM de la Unidad 1. Se migra desde un esquema de 6 máquinas virtuales operadas manualmente con `systemd` hacia una **arquitectura basada en microservicios contenerizados con Docker y orquestados con Docker Compose**.

Esta evolución aporta los siguientes beneficios técnicos:
1. **Reproducibilidad y Despliegue en un Solo Comando:** Eliminación de dependencias del sistema operativo host; todo el clúster arranca con `docker compose up -d`.
2. **Aislamiento y Seguridad:** Principio de mínimo privilegio con usuarios no root (`USER appuser`, `USER 101`), red de base de datos aislada (`internal: true`) y ausencia de credenciales en el repositorio.
3. **Observabilidad Integrada:** Stack de monitoreo compuesto por Prometheus y dashboards aprovisionados automáticamente en Grafana.
4. **Desacoplamiento Funcional:** Separación estricta entre capa de presentación (Frontend SPA), puerta de enlace (API Gateway), lógica de negocio (Backend Core API) y persistencia espacial.

---

## 2. Diagrama de Arquitectura de Contenedores

```
                          [ CIUDADANOS / FUNCIONARIOS ]
                                       │
                                       ▼ (Puerto 80 HTTP)
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CAPA 1: INGRESS / API GATEWAY                         │
│ Servicio: gateway (Nginx Unprivileged 1.27-alpine - Puerto Host: 80)        │
│ • /             ──► Enrutamiento hacia Frontend                             │
│ • /api/         ──► Enrutamiento hacia Backend Core                         │
│ • /gateway-health ──► Healthcheck propio                                    │
│ • /nginx_status ──► Métricas para Prometheus                                │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │ (Red: frontend_net)           │ (Red: backend_net)
                       ▼                               ▼
┌───────────────────────────────┐     ┌───────────────────────────────────────┐
│     CAPA 2: FRONTEND SPA      │     │      CAPA 3: BACKEND CORE API         │
│ Servicio: frontend            │     │ Servicio: backend                     │
│ (React 18 + Leaflet + Vite)   │     │ (Python 3.11-slim + Flask + Gunicorn) │
│ • Servido por Nginx no-root   │     │ • Autenticación JWT y Roles           │
│ • Mapas satelitales y capas   │     │ • Catastro de Sepulturas y Patios     │
│ • Puerto interno: 8080        │     │ • Catastro de 40 Mausoleos Históricos │
│ • Healthcheck: /health        │     │ • Healthcheck: /api/health            │
└───────────────────────────────┘     └───────────────────┬───────────────────┘
                                                          │ (Red: db_net - Internal)
                                                          ▼
                                      ┌───────────────────────────────────────┐
                                      │      CAPA 4: PERSISTENCIA ESPACIAL    │
                                      │ Servicio: database                    │
                                      │ (PostGIS 3.4 sobre PostgreSQL 16)     │
                                      │ • Extensiones postgis, topology       │
                                      │ • Volumen persistente: db_data        │
                                      │ • Red interna sin exposición pública  │
                                      │ • Healthcheck: pg_isready             │
                                      └───────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAPA 5: OBSERVABILIDAD Y MONITOREO                        │
│                                                                             │
│ ┌───────────────────────────────┐         ┌───────────────────────────────┐ │
│ │    Servicio: prometheus       │         │      Servicio: grafana        │ │
│ │    (v2.54.1 - Puerto 9090)    │◄────────┤    (v11.2.0 - Puerto 3000)    │ │
│ │    • Scrape de Gateway        │         │    • Dashboards automáticos   │ │
│ │    • Scrape de Backend Health │         │    • Estado UP/DOWN servicios │ │
│ └───────────────────────────────┘         └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Descomposición de Componentes de Aplicación

Para dar estricto cumplimiento al **Requisito 4.5 (Microservicios)** de la pauta:
1. **Frontend (`services/frontend`)**: Aplicación web SPA en React 18, empaquetada mediante una construcción multi-stage (`node:20-alpine3.20` -> `nginxinc/nginx-unprivileged:1.27-alpine`). Corre bajo usuario sin privilegios (UID 101).
2. **Backend Core (`services/backend`)**: API REST construida con Flask y SQLAlchemy. Ejecutada mediante Gunicorn WSGI con 3 workers, utilizando usuario de sistema `appuser` (UID 10001). Expone salud operativa en `/api/health`.
3. **API Gateway (`services/gateway`)**: Punto unificado de entrada L7 que centraliza las conexiones del navegador y las bifurca según la URI solicitada, protegiendo a los servicios internos de la exposición directa.
4. **Módulo de Inteligencia Artificial (`services/ai-service`)**: La arquitectura y el Gateway han sido diseñados con desacoplamiento total, de modo que la integración del microservicio de IA (a definir con el equipo) se conectará de manera inmediata bajo la ruta `/api/ai/` en la red `backend_net`.

---

## 4. Segmentación de Redes en Docker (Custom Networks)

La solución utiliza el driver `bridge` para crear 4 redes lógicas independientes:

| Red Docker | Propósito | Servicios Conectados | Aislamiento |
| :--- | :--- | :--- | :--- |
| `frontend_net` | Comunicación entre Gateway y servidor web estático. | `gateway`, `frontend` | Solo tráfico HTTP interno. |
| `backend_net` | Comunicación entre Gateway, Backend API y futuras extensiones. | `gateway`, `backend`, `prometheus` | Aísla la API REST. |
| `db_net` | Conexión transaccional y consultas espaciales a la base de datos. | `backend`, `database` | **`internal: true`**: La base de datos es totalmente inaccesible desde el host o internet. |
| `monitoring_net` | Canal de telemetría y métricas operativas. | `gateway`, `prometheus`, `grafana` | Tráfico de diagnóstico y observabilidad. |

---

## 5. Persistencia y Gestión de Volúmenes

Todos los datos críticos están desacoplados del ciclo de vida de los contenedores mediante **volúmenes nombrados**:
- **`db_data`**: Almacena el directorio `/var/lib/postgresql/data` de PostgreSQL/PostGIS. Si el contenedor se destruye o actualiza, la información catastral permanece intacta.
- **`prometheus_data`**: Persistencia de métricas y series temporales recolectadas.
- **`grafana_data`**: Almacenamiento de preferencias, sesiones y configuraciones de dashboards.

---

## 6. Políticas de Resiliencia y Health Checks

- **Orden de Arranque Seguro (`depends_on`):** Ningún servicio inicia hasta que su dependencia haya completado su ciclo de inicialización (`condition: service_healthy`). El Backend espera que PostGIS responda positivamente a `pg_isready`, y el Gateway espera que Frontend y Backend estén saludables.
- **Auto-recuperación (`restart: unless-stopped`):** Si un proceso falla, el daemon de Docker lo reinicia automáticamente.
- **Sondas de Salud Periódicas (`HEALTHCHECK`):** Cada contenedor cuenta con sondas nativas cada 15 a 30 segundos para evaluar su estado real.
