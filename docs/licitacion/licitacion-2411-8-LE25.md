# Contexto de la Licitación Pública
## Licitación Mercado Público ID: 2411-8-LE25
**Entidad Licitante:** Ilustre Municipalidad de Los Ángeles (Región del Biobío, Chile)  
**Proyecto:** "Desarrollo, Implementación y Puesta en Marcha de Sistema de Información Geográfica (SIG) y Plataforma Catastral para el Cementerio General de la Comuna de Los Ángeles"  
**Ubicación Predial:** Camino San Antonio s/n / Av. Gabriela Mistral (Coordenadas: `-37.4732, -72.3229`)  

---

## 1. Descripción del Problema Público

El Cementerio General de Los Ángeles es un recinto de gran valor histórico y social para la comuna, con una superficie que supera las 10 hectáreas, organizado en patios fundacionales que datan de los siglos XIX y XX.

Históricamente, la administración municipal ha enfrentado graves dificultades operativas:
1. **Pérdida y deterioro de registros físicos:** Libros de inhumación centenarios en papel propensos al deterioro, humedad y extravío.
2. **Falta de georreferenciación precisa:** Dificultad para deudos, visitantes y funcionarios en la localización exacta de sepulturas individuales y familiares.
3. **Desprotección del patrimonio:** Existencia de más de 40 mausoleos de valor arquitectónico e histórico que carecían de un catastro fotográfico y reseñas accesibles al público y a investigadores.
4. **Trámites presenciales lentos:** Los ciudadanos debían acudir físicamente a oficinas municipales para consultar si una sepultura se encontraba vigente o regularizada.

---

## 2. Actores y Usuarios del Sistema

- **Administrador General Municipal:** Control total de la plataforma, auditoría de usuarios, gestión de permisos y roles, visualización de métricas de ocupación.
- **Funcionario / Encargado de Catastro:** Registro, edición y actualización del estado de sepulturas, dibujo cartográfico de polígonos de patios y registro de defunciones.
- **Validador Topográfico / Terreno:** Inspección en terreno con dispositivos móviles para verificar coordenadas GPS y fotografías de lápidas y mausoleos.
- **Ciudadano / Deudo (Público General):** Acceso público sin necesidad de iniciar sesión para buscar familiares fallecidos, visualizar la ruta hacia la sepultura y conocer la historia de los mausoleos patrimoniales.

---

## 3. Matriz de Requisitos Funcionales (RF)

| Código | Requisito Funcional | Implementación en el Proyecto |
| :--- | :--- | :--- |
| **RF01** | Autenticación Segura | Inicio de sesión con JWT y contraseñas cifradas en `bcrypt`. |
| **RF02** | Control de Acceso Basado en Roles (RBAC) | Perfiles: `administrador`, `funcionario`, `publico`. |
| **RF03** | Gestión de Usuarios | Módulo CRUD para administración de personal municipal. |
| **RF04** | Registro de Sepulturas | Inserción de difuntos con coordenadas espaciales (Lat, Lon). |
| **RF05** | Actualización de Sepulturas | Edición de estado (Ocupada, Disponible, En Mantención). |
| **RF06** | Baja Lógica (Soft Delete) | Desactivación de registros preservando la trazabilidad histórica. |
| **RF07** | Consulta Ficha Individual | Vista detallada del fallecido, patio, fila y número. |
| **RF08** | Búsqueda Multicriterio | Búsqueda por nombre, apellido, patio, sector y rango de años. |
| **RF09** | Datos Geoespaciales | Uso de tipos geométricos `Point` y `Polygon` mediante PostGIS. |
| **RF10** | Visor Cartográfico Interactivo | Mapas Leaflet integrados con imágenes satelitales y capas GeoJSON. |
| **RF11** | Portal Ciudadano Abierto | Consultas públicas sin credenciales para visitantes. |
| **RF12** | Catastro de Mausoleos Emblemáticos | Ficha patrimonial de 40 mausoleos con reseñas históricas y fotos. |

---

## 4. Requisitos No Funcionales (RNF)

- **RNF01 (Disponibilidad y Resiliencia):** Operación ininterrumpida ante caídas de procesos, respaldada por contenedores con políticas de reinicio y health checks continuos.
- **RNF02 (Seguridad):** Ejecución estricta con usuarios sin privilegios (`non-root`) y aislamiento de la base de datos en una red interna privada.
- **RNF03 (Rendimiento):** Tiempos de respuesta de la API REST inferiores a 200 ms para búsquedas catastrales.
- **RNF04 (Persistencia Desacoplada):** Los datos geográficos y tablas residen en volúmenes Docker independientes del ciclo de vida de los contenedores.
- **RNF05 (Monitoreo Continuo):** Recolección de métricas con Prometheus y visualización de salud en Grafana.
- **RNF06 (Recuperación ante Desastres):** Procedimientos automatizados de backup diario con compresión gzip y scripts de restauración probados.

