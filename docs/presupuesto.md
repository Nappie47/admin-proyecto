# Análisis Económico y Presupuesto del Proyecto
## Licitación Mercado Público ID: 2411-8-LE25 - Cementerio General de Los Ángeles
**Integrantes:** Bryan Ahumada - Johan Muñoz  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Profesor:** Ricardo Pérez  

---

## 1. Resumen Ejecutivo

El presente análisis económico detalla la estructura presupuestaria para el diseño, desarrollo, despliegue, operación y mantenimiento del Sistema de Información Geográfica (SIG) y Plataforma de Gestión Catastral del Cementerio General de Los Ángeles.

Se presenta un contraste cuantitativo entre la **infraestructura tradicional multi-VM de la Unidad 1** versus la **arquitectura moderna contenerizada con Docker de la Unidad 2**, evidenciando una reducción sustancial de costos operativos y de consumo en nube de más de un **65% mensual**.

Valores expresados en **Pesos Chilenos (CLP)** y referenciados en **Dólares Americanos (USD)** considerando una tasa de cambio estimada de $950 CLP/USD.

---

## 2. Costos de Desarrollo (Inversión Inicial - CAPEX)

El desarrollo del proyecto se planificó considerando un equipo de dos ingenieros durante un período de **6 semanas** (240 horas de trabajo efectivo por integrante):

| Perfil Profesional | Horas (HH) | Valor Hora (CLP) | Total (CLP) | Total (USD) |
| :--- | :---: | :---: | :---: | :---: |
| **Ingeniero DevOps & Infraestructura** (Bryan Ahumada) | 120 hrs | $22.000 | $2.640.000 | $2.778 |
| **Ingeniero Backend & Especialista SIG** (Johan Muñoz) | 120 hrs | $22.000 | $2.640.000 | $2.778 |
| **Ingeniero Frontend & UX Cartográfica** | 120 hrs | $20.000 | $2.400.000 | $2.526 |
| **QA, Pruebas de Carga y Resiliencia** | 80 hrs | $18.000 | $1.440.000 | $1.515 |
| **Documentación Técnica y Capacitación Municipal** | 40 hrs | $15.000 | $600.000 | $631 |
| **SUBTOTAL DESARROLLO** | **480 hrs** | — | **$9.720.000** | **$10.228** |

---

## 3. Costos de Infraestructura (Comparativa U1 vs U2)

### A. Unidad 1: Infraestructura Tradicional en GCP (6 Máquinas Virtuales)
En la Unidad 1 se requería mantener 6 instancias de Compute Engine encendidas de forma permanente:

| Recurso / Máquina Virtual | Tipo de Instancia GCP | vCPU / RAM | Disco SSD | Costo Mensual (USD) | Costo Mensual (CLP) |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **vm-web-haproxy** (Ingress L7) | e2-micro | 2 vCPU / 1 GB | 20 GB | $8.50 | $8.075 |
| **vm-app-1** (Frontend + Backend) | e2-medium | 2 vCPU / 4 GB | 30 GB | $26.80 | $25.460 |
| **vm-app-2** (Réplica App) | e2-medium | 2 vCPU / 4 GB | 30 GB | $26.80 | $25.460 |
| **vm-db-haproxy** (Enrutador DB + etcd) | e2-micro | 2 vCPU / 1 GB | 20 GB | $8.50 | $8.075 |
| **vm-db-master** (Postgres + Patroni) | e2-medium | 2 vCPU / 4 GB | 50 GB | $29.20 | $27.740 |
| **vm-db-replica** (Standby + Patroni) | e2-medium | 2 vCPU / 4 GB | 50 GB | $29.20 | $27.740 |
| IP Pública Estática + Tráfico de Red (VPC Peering) | — | — | — | $15.00 | $14.250 |
| **TOTAL MENSUAL UNIDAD 1 (6 VMs)** | | | | **$144.00 USD/mes** | **$136.800 CLP/mes** |
| **TOTAL ANUALIZADO UNIDAD 1** | | | | **$1.728 USD/año** | **$1.641.600 CLP/año** |

---

### B. Unidad 2: Arquitectura Basada en Contenedores (Docker & Compose)
Gracias a la contenerización, la densidad de uso de hardware aumenta radicalmente. La totalidad de los 6 servicios (`gateway`, `frontend`, `backend`, `database`, `prometheus`, `grafana`) se ejecutan en un único nodo de producción optimizado (o clúster de 2 nodos para alta disponibilidad):

| Recurso en GCP (Unidad 2) | Especificación | Uso de Recursos | Costo Mensual (USD) | Costo Mensual (CLP) |
| :--- | :--- | :--- | :---: | :---: |
| **Instancia de Producción Docker** | GCP e2-standard-2 (2 vCPU, 8 GB RAM) | Aloja todo el stack de microservicios | $48.90 | $46.455 |
| **Almacenamiento Persistente** | 100 GB SSD Persistent Disk (para volúmenes y backups) | Alta velocidad I/O para PostGIS | $17.00 | $16.150 |
| **Cloud Storage (Bucket Coldline)** | 50 GB para copias de seguridad remotas | Respaldo off-site de `backup.sh` | $1.20 | $1.140 |
| **IP Pública Estática y Tráfico Egress** | 1 IP IPv4 reservada + 50 GB transferencia | Ingress Gateway L7 | $4.50 | $4.275 |
| **TOTAL MENSUAL UNIDAD 2 (Docker)** | | | **$71.60 USD/mes** | **$68.020 CLP/mes** |
| **TOTAL ANUALIZADO UNIDAD 2** | | | **$859.20 USD/año** | **$816.240 CLP/año** |

> 💡 **Ahorro Directo de Infraestructura:** La migración a Docker genera un ahorro anual de **$825.360 CLP (~$868.80 USD)**, equivalente a un **50.3% de reducción en costos de cómputo en la nube**.

---

## 4. Costos de Operación y Mantención (OPEX Anual)

Para asegurar la continuidad operativa del servicio municipal conforme a los estándares de la licitación pública:

| Concepto de Mantención | Alcance Operativo | Periodicidad | Total Anual (CLP) |
| :--- | :--- | :---: | :---: |
| **Soporte Técnico y Mesa de Ayuda** | Atención a funcionarios municipales (Lunes a Viernes 8:30 - 17:30) | Mensual | $2.400.000 |
| **Monitoreo y Gestión Preventiva** | Revisión de alertas Grafana/Prometheus y parches de seguridad Docker | Mensual | $1.200.000 |
| **Auditoría y Pruebas de Restore** | Simulación trimestral de desastres y verificación de `restore.sh` | Trimestral | $480.000 |
| **Actualizaciones Menores de Software** | Optimización de índices espaciales y mejoras de interfaz | Semestral | $720.000 |
| **TOTAL MANTENCIÓN ANUAL** | | | **$4.800.000 CLP/año** |

---

## 5. Costos Estimados del Componente de Inteligencia Artificial

Para la futura incorporación del microservicio de Inteligencia Artificial (`services/ai-service`), se evaluaron dos alternativas tecnológicas:

| Alternativa | Descripción Técnica | Costo de Implementación | Costo Mensual Estimado |
| :--- | :--- | :---: | :---: |
| **Opción A: Inferencia Local con Ollama** | Modelo Open-Source (Llama 3 / Mistral) ejecutado en CPU/GPU del servidor. Privacidad total de datos y sin cobro por petición. | $450.000 CLP (configuración inicial) | **$0 CLP/mes** adicionales (incluido en servidor Docker). |
| **Opción B: API Gestionada (Gemini / OpenAI)** | Consumo mediante API REST basado en volumen de tokens. Ideal para asistentes conversacionales y búsqueda semántica. | $250.000 CLP (integración API) | **~$10 a $15 USD/mes** (~$9.500 - $14.250 CLP para ~15.000 consultas ciudadanas mensuales). |

---

## 6. Presupuesto Consolidado de la Propuesta (Año 1)

| Partida Presupuestaria | Subtotal (CLP) | Subtotal (USD) | % del Total |
| :--- | :---: | :---: | :---: |
| **1. Desarrollo e Implementación (CAPEX)** | $9.720.000 | $10.228 | 61.4 % |
| **2. Infraestructura en la Nube (Docker 12 meses)** | $816.240 | $859 | 5.2 % |
| **3. Operación y Mantención Anual (OPEX)** | $4.800.000 | $5.053 | 30.3 % |
| **4. Integración y Cómputo Componente IA** | $490.000 | $516 | 3.1 % |
| **TOTAL PROPUESTA INTEGRAL (AÑO 1)** | **$15.826.240 CLP** | **$16.656 USD** | **100 %** |

