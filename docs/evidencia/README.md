# Registro de Evidencias de Seguridad - Unidad 3
## Administración de Redes y Sistemas Computacionales - Universidad de Talca
**Integrantes:** Bryan Ahumada - Johan Muñoz  
**Profesor:** Ricardo Pérez  

---

Esta carpeta almacena de forma ordenada y reproducible las salidas de las herramientas de auditoría exigidas por la pauta oficial de la Unidad 3:

### 1. `docs/evidencia/antes/` (Línea Base Inicial)
Registros capturados con la solución desplegada tal cual en su estado inicial antes del hardening:
* `nmap-external-baseline.txt`: Escaneo Nmap externo hacia la IP pública de la EC2 antes del endurecimiento.
* `nmap-internal-baseline.txt`: Escaneo Nmap interno dentro de la VPC demostrando exposición previa.
* `lynis-baseline.txt`: Auditoría inicial del sistema operativo con Lynis mostrando el puntaje base (~58-60).
* `trivy-backend-baseline.txt`: Análisis de vulnerabilidades de la imagen backend sin directivas no-root.
* `trivy-frontend-baseline.txt`: Análisis de la imagen frontend inicial.

### 2. `docs/evidencia/despues/` (Estado Endurecido)
Registros capturados tras aplicar las medidas de las Partes A, B, C y D:
* `nmap-external-final.txt`: Escaneo Nmap demostrando que solo el puerto 443 responde hacia Internet y que las firmas de software están ocultas (`server_tokens off;`).
* `nmap-internal-final.txt`: Escaneo demostrando aislamiento perimetral: PostgreSQL solo acepta tráfico desde el Gateway/Backend.
* `lynis-final.txt`: Auditoría Lynis del host demostrando el incremento a más de 82 puntos.
* `trivy-backend-final.txt`: Análisis Trivy demostrando 0 vulnerabilidades CRITICAL y HIGH tras el uso de imágenes fijas hardened.
* `trivy-frontend-final.txt`: Análisis Trivy de la imagen frontend Nginx unprivileged.
* `testssl-final.txt`: Salida de `testssl.sh` certificando soporte exclusivo de TLS 1.2 / TLS 1.3 con cipher suites seguras y Perfect Forward Secrecy (PFS).
* `gitleaks-final.sarif`: Reporte de auditoría confirmando 0 credenciales o secretos filtrados en Git.
* `load-test-report.txt`: Resultados de la prueba de carga (+5 pts bono) evidenciando la mitigación por Rate Limiting.
