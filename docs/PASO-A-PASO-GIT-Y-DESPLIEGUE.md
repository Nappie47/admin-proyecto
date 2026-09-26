# Guía Paso a Paso: Commits de Git y Despliegue (Local y Google Cloud)
## Proyecto Cementerio General Comuna de Los Ángeles - Arquitectura 2

Esta guía describe el orden exacto de commits recomendados para tu repositorio Git y las instrucciones de despliegue capa por capa tanto en tu PC como en Google Cloud Platform.

---

## 1. Plan de Commits Paso a Paso en Git

Te sugerimos realizar los siguientes commits secuenciales para que tu historial de Git quede impecable y refleje el desarrollo profesional por capas:

### Commit 1: Documentación y Arquitectura
```bash
git add docs/ README.md .gitignore
git commit -m "docs: definir especificación técnica Arquitectura 2 y guía de costos GCP"
```

### Commit 2: Capa de Base de Datos y Respaldo (Capa 4 y Capa 5)
```bash
git add vms/vm-5-db-primaria/ vms/vm-6-db-replica/ vms/vm-7-backup-server/
git commit -m "feat(database): implementar Capa 4 (PostgreSQL 16 + PostGIS) y Capa 5 (Respaldos pg_dump)"
```

### Commit 3: Capa de Balanceo de Base de Datos (Capa 3)
```bash
git add vms/vm-4-haproxy-db/
git commit -m "feat(proxy-db): implementar Capa 3 HAProxy DB con enrutamiento de lectura/escritura"
```

### Commit 4: Microservicio Backend REST API
```bash
git add backend/
git commit -m "feat(backend): implementar API REST Flask con autenticación JWT, GeoJSON y PostGIS"
```

### Commit 5: Frontend Web SPA y Mockups
```bash
git add frontend/
git commit -m "feat(frontend): implementar interfaz React, Leaflet interactivo y vistas según mockups"
```

### Commit 6: Capa de Servidores de Aplicaciones (Capa 2)
```bash
git add vms/vm-2-app-principal/ vms/vm-3-app-replica/
git commit -m "feat(app-tier): implementar Capa 2 con NGINX, Frontend y Backend en VM2 y VM3"
```

### Commit 7: Capa de Ingress y Balanceo Web (Capa 1) + Orquestación
```bash
git add vms/vm-1-haproxy-web/ docker-compose.yml scripts/
git commit -m "feat(ingress): implementar Capa 1 HAProxy Web y scripts de despliegue local"
```

---

## 2. Cómo Ejecutarlo en tu PC (Paso a Paso)

### Opción A: Despliegue Automático con un solo script (Recomendada)
Abre PowerShell en la raíz del proyecto (`admin-proyecto`):
```powershell
.\scripts\iniciar-todo.ps1
```
Este script:
1. Crea la red Docker compartida `red_cementerio_cluster`.
2. Inicia la Capa 4 (Bases de datos PostGIS).
3. Inicia la Capa 3 (HAProxy DB).
4. Compila e inicia la Capa 2 (VM 2 y VM 3 con Nginx, React y Flask).
5. Inicia la Capa 1 (HAProxy Web Ingress).
6. Inicia la Capa 5 (Servidor de Respaldos).

### Opción B: Despliegue Manual Capa por Capa (De Abajo a Arriba)
Si deseas validar cada máquina virtual individualmente:

1. **Crear red puente:**
   ```bash
   docker network create red_cementerio_cluster
   ```
2. **Capa 4 (Base de Datos):**
   ```bash
   cd vms/vm-5-db-primaria && docker compose up -d
   cd ../vm-6-db-replica && docker compose up -d
   ```
3. **Capa 3 (HAProxy DB):**
   ```bash
   cd ../vm-4-haproxy-db && docker compose up -d
   ```
4. **Capa 2 (Servidores de Aplicación):**
   ```bash
   cd ../vm-2-app-principal && docker compose up -d --build
   cd ../vm-3-app-replica && docker compose up -d --build
   ```
5. **Capa 1 (Balanceador Web Ingress):**
   ```bash
   cd ../vm-1-haproxy-web && docker compose up -d
   ```
6. **Capa 5 (Servidor de Respaldo):**
   ```bash
   cd ../vm-7-backup-server && docker compose up -d --build
   ```

---

## 3. URLs de Acceso en tu PC

Una vez levantado:
- **Portal Ciudadano e Ingress Principal (HAProxy):** [http://localhost](http://localhost)
- **Panel de Estadísticas HAProxy:** [http://localhost/haproxy?stats](http://localhost/haproxy?stats)
- **Servidor App 1 (Directo):** [http://localhost:8081](http://localhost:8081)
- **Servidor App 2 (Directo):** [http://localhost:8082](http://localhost:8082)
- **API Health:** [http://localhost/api/health](http://localhost/api/health)
- **API Sepulturas:** [http://localhost/api/sepulturas](http://localhost/api/sepulturas)
- **API Mausoleos:** [http://localhost/api/mausoleos](http://localhost/api/mausoleos)
- **API Patios:** [http://localhost/api/patios](http://localhost/api/patios)

---

## 4. Credenciales Iniciales del Sistema

El script de inicialización puebla automáticamente los usuarios de prueba:
- **Administrador:**
  - Correo: `admin@losangeles.cl`
  - Contraseña: `AdminPassword123!`
  - Rol: `administrador` (Acceso completo a Dashboard, CRUD de sepulturas y usuarios)
- **Funcionario Municipal:**
  - Correo: `funcionario@losangeles.cl`
  - Contraseña: `Funcionario123!`
  - Rol: `funcionario` (Edición y registro de sepulturas en terreno)
- **Público General:**
  - Acceso libre e irrestricto sin autenticación a través del visor público y buscador.

---

## 5. Cómo Desplegar en Google Cloud Platform (GCP)

Cuando estés listo para subir a GCP:
1. Sigue la guía [docs/GUIA-GCP-BAJO-COSTO.md](file:///c:/Users/Administrator/Desktop/admin-proyecto/docs/GUIA-GCP-BAJO-COSTO.md) para crear las 7 VMs usando instancias Spot (`e2-micro` y `e2-small`).
2. En cada VM, instala Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
   ```
3. Clona tu repositorio Git en cada máquina:
   ```bash
   git clone <url-de-tu-repositorio>
   ```
4. En cada VM, entra a su carpeta correspondiente dentro de `vms/` y ejecuta `docker compose up -d`.
   - En `vm-1-haproxy-web/haproxy.cfg`, las direcciones de servidor serán las IPs privadas de VM 2 y VM 3 (ej. `10.0.2.11:80` y `10.0.2.12:80`).
   - En `vm-4-haproxy-db/haproxy.cfg`, las direcciones serán las IPs de VM 5 y VM 6 (ej. `10.0.3.11:5432` y `10.0.3.12:5432`).
5. Accede desde internet a la IP pública de la **VM 1**.
