# Documentación Técnica Unidad 3: Hardening, Criptografía y Seguridad Perimetral en AWS
## Sistema de Información Geográfica (SIG) - Cementerio General de Los Ángeles

**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Profesor Evaluador:** Ricardo Pérez (riperez@utalca.cl)  
**Semestre:** 2026-II — Universidad de Talca (ICC)  
**Integrantes:**
- Bryan Ahumada
- Johan Muñoz

**Licitación Mercado Público:** 2411-8-LE25 (*Desarrollo e Implementación de Sistema de Información Geográfica y Plataforma Catastral para el Cementerio General de Los Ángeles*)

---

## 1. Introducción y Objetivos de la Unidad 3

El presente documento detalla la ingeniería de seguridad, hardening de sistemas, criptografía aplicada y control perimetral implementados en **Amazon Web Services (AWS)** para el Sistema de Información Geográfica del Cementerio General de Los Ángeles.

El proyecto consolida la evolución técnica de las etapas anteriores:
- **Unidad 1:** Arquitectura nativa multi-VM (6 instancias Debian 13 en GCP con Patroni, etcd, PostgreSQL, PostGIS y HAProxy).
- **Unidad 2:** Contenerización en microservicios mediante Docker y Docker Compose con alta disponibilidad, microservicio de IA biométrica y monitoreo.
- **Unidad 3:** Despliegue seguro en **AWS**, aplicando un esquema de **Defensa en Profundidad** (*Defense in Depth*) y el **Principio de Mínimo Privilegio**, garantizando la reducción medible de la superficie de ataque mediante auditorías comparativas (*antes* vs. *después*).

---

## 2. Arquitectura de Red e Identidad en AWS (Parte A)

### 2.1 Topología de Red en AWS VPC

La solución se ejecuta en una **VPC dedicada** (`vpc-cemetery-u3`) con bloque CIDR `10.0.0.0/16`, segmentada estrictamente en dos niveles de aislamiento:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            VPC DEDICADA: 10.0.0.0/16                             │
│                                                                                  │
│   [ INTERNET ]                                                                   │
│        │                                                                         │
│        ▼ (HTTPS 443 / HTTP 80 Redirect)                                          │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ SUBRED PÚBLICA: 10.0.1.0/24 (us-east-1a)                                 │   │
│   │ • Internet Gateway (IGW: igw-cemetery)                                   │   │
│   │ • Ingress Gateway L7 (Nginx Hardened con TLS 1.3 y Reverse Proxy)        │   │
│   │ • NAT Gateway / Elastic IP (Egress seguro para la subred privada)        │   │
│   │ • Security Group: sg-gateway                                             │   │
│   │   - Ingress: 80, 443 (0.0.0.0/0) | 22 (Solo IP pública del Administrador)│   │
│   └─────────────────────────────────────┬────────────────────────────────────┘   │
│                                         │                                        │
│                                         ▼ (Tráfico enrutado por redes internas)  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ SUBRED PRIVADA: 10.0.2.0/24 (us-east-1a) - SIN IP PÚBLICA                │   │
│   │ • Instancia EC2 (Ubuntu 22.04 LTS / Tipo t3.medium)                      │   │
│   │ • Stack Docker Hardened:                                                 │   │
│   │   - Frontend (Nginx unprivileged, UID 101, read-only)                    │   │
│   │   - Backend REST API (Flask, Gunicorn, UID 10001, cap_drop: ALL)         │   │
│   │   - Microservicio IA (OpenCV Biometría Facial, UID 10001)                │   │
│   │   - Base de Datos (PostgreSQL 16 + PostGIS 3.4 en red aislada)           │   │
│   │ • Almacenamiento: Volumen EBS cifrado con AWS KMS (CMEK)                 │   │
│   │ • Security Group: sg-internal-app (ENCADENADO a sg-gateway)              │   │
│   │ • Rol IAM (Instance Profile): Acceso estricto a S3 y Secrets Manager     │   │
│   └─────────────────────────────────────┬────────────────────────────────────┘   │
│                                         │                                        │
│                                         ▼ (Respaldos cifrados con SSE-KMS)       │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ SERVICIOS GESTIONADOS AWS                                                │   │
│   │ • Bucket Amazon S3: cemetery-backups-u3 (Versionado + Block Public)      │   │
│   │ • AWS KMS: Llave simétrica CMEK alias/cementerio-u3-key                   │   │
│   │ • AWS Budgets: Alerta de consumo a 20 USD mensuales                      │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Correspondencia con la Segmentación Docker de la Unidad 2

La segmentación física de AWS se mapea directamente con las redes internas de Docker Compose:
1. **`cemetery_public_net` (Pública):** Aloja el puerto 80 y 443 del contenedor `gateway`.
2. **`cemetery_backend_net` (Interna de Aplicación):** Conecta el Gateway con los servicios `frontend`, `backend` y `ai-service`.
3. **`cemetery_db_net` (Persistencia Aislada - `internal: true`):** Conecta exclusivamente `backend` con `db`. No tiene enrutamiento hacia el Gateway ni salida a Internet, impidiendo cualquier acceso directo no autorizado.

### 2.3 Identidad y Permisos Mínimos (IAM Instance Profile)

Para eliminar cualquier necesidad de incrustar llaves de acceso (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) en el código o variables de entorno:
* Se creó el rol **`cementerio-ec2-instance-role`** asociado a la instancia EC2 como **Instance Profile**.
* La política IAM otorga permisos limitados a nivel de recurso:
  * `s3:PutObject`, `s3:GetObject` sobre `arn:aws:s3:::cementerio-backups-u3/*`.
  * `kms:Encrypt`, `kms:Decrypt`, `kms:GenerateDataKey` sobre la llave específica `alias/cementerio-u3-key`.
* No se utilizan comodines `*` en recursos críticos.

### 2.4 Control de Costos y Procedimiento de Apagado

* **AWS Budgets:** Se configuró una alerta presupuestaria fijada en **$15 USD** con notificación por correo al 80% y 100% del gasto proyectado.
* **Procedimiento de Desconexión / Eliminación:**
  ```bash
  # 1. Detener contenedores Docker en la EC2:
  docker compose -f docker-compose.hardened.yml down
  # 2. Detener la instancia EC2 para pausar cobros de cómputo:
  aws ec2 stop-instances --instance-ids [ID_INSTANCIA]
  # 3. Al finalizar la evaluación de la Unidad 3, destrucción limpia vía Terraform:
  cd terraform && terraform destroy -auto-approve
  ```

---

## 3. Hardening de Instancia, Servicios y Contenedores (Parte B)

### 3.1 Hardening de Acceso Remoto (SSH) y del Host

En la máquina virtual EC2 se aplicaron medidas de endurecimiento sobre `/etc/ssh/sshd_config`:
1. **Deshabilitación de Root:** `PermitRootLogin no`.
2. **Eliminación de Autenticación por Contraseña:** `PasswordAuthentication no`.
3. **Criptografía Asimétrica Moderna:** Acceso exclusivo mediante algoritmo **Ed25519** (`cemetery-u3-key.pem`), descartando llaves RSA débiles.
4. **Restricción de Origen:** El Security Group solo permite el puerto 22 desde la IP fija de los estudiantes (`/32`).
5. **Mitigación de Fuerza Bruta:** Instalación y activación de **`fail2ban`** monitoreando los logs de autenticación de SSH (ban de 3600s tras 3 intentos fallidos).
6. **Timeouts y Control de Intentos:**
   * `ClientAliveInterval 300` y `ClientAliveCountMax 2` (cierre de sesión inactiva tras 10 min).
   * `MaxAuthTries 3`.
   * `AllowUsers ubuntu`.
7. **Actualizaciones de Seguridad Automáticas:** Servicio `unattended-upgrades` habilitado para aplicar parches del kernel y de seguridad de Debian/Ubuntu diariamente.

### 3.2 Hardening de Contenedores Docker

En [`docker-compose.hardened.yml`](../docker-compose.hardened.yml) se implementaron las siguientes directivas de contención del kernel:
* **Usuarios No Privilegiados:** Ningún contenedor corre como `root`. Frontend corre como UID 101 (`nginx`), Backend y AI Service corren como UID 10001 (`appuser`).
* **Descarte de Capacidades de Linux (`cap_drop: [ALL]`):** Se revocan todos los privilegios POSIX del kernel (como `CAP_SYS_ADMIN`, `CAP_NET_RAW`). Solo el Gateway añade `NET_BIND_SERVICE` para enlazar los puertos 80 y 443.
* **Prevención de Escalamiento:** Directiva `security_opt: [no-new-privileges:true]` activa en todos los servicios.
* **Filesystem de Solo Lectura:** Directiva `read_only: true` activada en los contenedores. Las escrituras volátiles se delegan a particiones temporales en memoria RAM mediante `tmpfs` (`/tmp:size=32m,noexec,nosuid`).
* **Límites de Recursos:** Cuotas estrictas de CPU y RAM por contenedor para prevenir ataques de denegación de servicio por agotamiento de memoria (*cgroups OOM*).
* **Ausencia de Montaje de Docker Socket:** Ningún servicio monta `/var/run/docker.sock`.

### 3.3 Cabeceras de Seguridad HTTP en el Gateway

El proxy inverso Nginx incorpora cabeceras validadas por OWASP Secure Headers:
* `server_tokens off;`: Suprime la versión de Nginx y del sistema operativo.
* `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`: Fuerza navegación HTTPS durante 1 año.
* `X-Frame-Options: SAMEORIGIN`: Previene ataques de Clickjacking.
* `X-Content-Type-Options: nosniff`: Evita la interpretación MIME errónea de archivos.
* `Content-Security-Policy`: Restringe la carga de scripts, estilos e imágenes exclusivamente a dominios autorizados (origen local, Google Maps API y CartoDB).
* `Permissions-Policy`: Desactiva micrófonos y restringe el uso de cámara web al dominio propio (necesario para el reconocimiento facial).

---

## 4. Criptografía, Gestión de Secretos y Protección de Datos (Parte C)

### 4.1 Cifrado en Tránsito (HTTPS / TLS 1.3)

* **Redirección Forzada:** Todo intento de acceso por HTTP puerto 80 es redirigido inmediatamente con código HTTP 301 hacia `https://$host$request_uri`.
* **Deshabilitación de Cifradores Inseguros:** Se desactivan totalmente SSLv2, SSLv3, TLS 1.0 y TLS 1.1.
* **Protocolos Permitidos:** **Únicamente TLS 1.2 y TLS 1.3**.
* **Suites Criptográficas:** Se configuran suites de curva elíptica con secreto hacia adelante (*Perfect Forward Secrecy - PFS*):
  * `ECDHE-ECDSA-AES256-GCM-SHA384`
  * `ECDHE-RSA-AES256-GCM-SHA384`
  * `ECDHE-ECDSA-CHACHA20-POLY1305`
* **Terminación TLS:** El cifrado TLS termina en el contenedor Gateway (`cemetery_gateway_hardened`). El tráfico entre el Gateway y los microservicios backend viaja por la red interna aislada de Docker (`cemetery_backend_net`), justificando el riesgo residual mediante aislamiento de capa de red.

### 4.2 Gestión de Secretos y Escaneo con Gitleaks

* **Cero Secretos en el Repositorio:** Ni contraseñas de base de datos ni firmas JWT residen en texto plano en Git.
* **Inyección en Tiempo de Ejecución:** Las variables sensibles se inyectan mediante variables de entorno en el host o mediante AWS Secrets Manager.
* **Verificación de Auditoría:** Se ejecutó la herramienta **Gitleaks** sobre todo el repositorio y su árbol de commits mediante el archivo `.gitleaks.toml`, confirmando **0 secretos detectados**.

### 4.3 Cifrado en Reposo e Inventario de Datos Sensibles

* **Volúmenes EBS Cifrados:** El disco de la instancia EC2 posee cifrado nativo en reposo mediante **AWS KMS** con algoritmo **AES-256**.
* **Respaldos en Amazon S3:** Las copias de seguridad de la base de datos se generan con `pg_dump`, se comprimen con `gzip` y se transfieren a Amazon S3 con cifrado del lado del servidor gestionado por KMS (**SSE-KMS**).
* **Hash Seguro de Contraseñas:** Las contraseñas de los funcionarios municipales y administradores se almacenan protegidas mediante **bcrypt** con factor de trabajo $12$ y sal única por usuario.

#### Inventario de Datos Sensibles

| Categoría de Dato | Datos Concretos | Clasificación | Almacenamiento | Protección en Tránsito | Protección en Reposo | Acceso Autorizado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Credenciales** | Contraseñas de usuarios y administradores | Confidencial / Crítico | PostgreSQL (`usuarios.password_hash`) | TLS 1.3 HTTPS | Hash Bcrypt (Salt + 12 rondas) | Solo el sistema para login |
| **Biometría Facial** | Vectores numéricos (128x128) y plantillas faciales | Dato Sensible | Volumen Docker `cemetery_ai_faces_u3` | TLS 1.3 HTTPS | Volumen EBS cifrado (KMS AES-256) | Microservicio de IA |
| **Datos de Fallecidos** | Nombres, RUT/ID, fecha defunción, ubicación sepultura | Público / Municipal | PostgreSQL (`sepulturas`, `patios`) | TLS 1.3 HTTPS | EBS KMS AES-256 | Consulta ciudadana y funcionarios |
| **Tokens de Sesión** | JSON Web Tokens (JWT) firmados | Confidencial | LocalStorage del navegador | TLS 1.3 HTTPS | Expiración 8h + Firma HMAC-SHA256 | Usuario autenticado |

### 4.4 Mapa Criptográfico de la Solución (Requisito Obligatorio)

Ver archivo [`docs/mapa-criptografico.csv`](mapa-criptografico.csv) para la tabla formal de entrega.

| Uso / Mecanismo | Algoritmo | Tipo | Generación / Almacenamiento de Llave | Rotación / Renovación |
| :--- | :--- | :--- | :--- | :--- |
| **Tráfico Web (HTTPS)** | TLS 1.3 / AES-256-GCM / PFS | Simétrica (sesión) / Asimétrica (cert) | Par de llaves RSA 2048 o ECDSA en `/etc/nginx/ssl` | Renovación cada 90 días (Certbot) |
| **Acceso Remoto SSH** | Ed25519 (Curva de Edwards) | Asimétrica | Generada en cliente; llave pública en `~/.ssh/authorized_keys` | Rotación anual o ante revocación |
| **Cifrado EBS y S3** | AES-256 (AWS KMS) | Simétrica | AWS KMS HSM (Llave administrada `alias/cementerio-u3-key`) | Rotación automática anual en AWS KMS |
| **Hash de Contraseñas** | Bcrypt (Blowfish) | Función Hash Criptográfica | Sal aleatoria de 128 bits generada por registro | Re-hash automático ante cambio de password |
| **Tokens JWT** | HMAC-SHA256 (HS256) | Simétrica (MAC) | Secreto en variable de entorno `JWT_SECRET_KEY` | Rotación cada 6 meses o ante incidente |
| **Firmas WAF y Rate Limit** | HMAC-SHA256 | Simétrica | Gestionada en memoria por Nginx/Fail2ban | Volátil en memoria RAM |

---

## 5. Firewall y Seguridad Perimetral (Parte D)

### 5.1 Security Groups de AWS

Se implementó el principio de **Default-Deny**:
1. **`sg-gateway` (Público):** Bloquea todo el tráfico excepto puertos 80, 443 a `0.0.0.0/0` y puerto 22 a la IP `/32` del administrador.
2. **`sg-internal-app` (Privado):** No tiene reglas con origen `0.0.0.0/0`. Solamente autoriza conexiones entrantes en los puertos 5000 (API) y 5432 (PostgreSQL) si el tráfico proviene de una instancia asociada al Security Group `sg-gateway`.

### 5.2 Firewall del Host y Coherencia con Docker (`DOCKER-USER`)

Docker manipula la tabla `nat` y `filter` de iptables, lo que comúnmente causa que los puertos expuestos en Docker evadan las reglas de firewalls locales como UFW. Para resolverlo y cumplir la exigencia de la pauta:
* Se configuraron reglas explícitas en la cadena **`DOCKER-USER`** de `iptables`:
  ```bash
  # Forzar que el tráfico hacia los contenedores sea filtrado por la cadena DOCKER-USER
  sudo iptables -I DOCKER-USER -i eth0 ! -s [IP_ADMIN]/32 -p tcp --dport 22 -j DROP
  ```
* Se verifica con: `sudo iptables -L DOCKER-USER -v -n`.

---

## 6. Validación y Evidencia Comparativa Antes vs. Después (Parte E)

Las capturas y reportes de auditoría residen en [`docs/evidencia/`](evidencia/):

| Herramienta | Evidencia ANTES (`docs/evidencia/antes/`) | Evidencia DESPUÉS (`docs/evidencia/despues/`) | Mejora Cuantitativa Demostrada |
| :--- | :--- | :--- | :--- |
| **Nmap Externo** | `nmap-external-baseline.txt` | `nmap-external-final.txt` | Puertos innecesarios cerrados/filtrados. Solo puerto 443 expuesto con banners de versión ocultos. |
| **Nmap Interno** | `nmap-internal-baseline.txt` | `nmap-internal-final.txt` | Demuestra aislamiento de red: PostgreSQL no es alcanzable fuera de la subred privada. |
| **Lynis (SO)** | `lynis-baseline.txt` | `lynis-final.txt` | Hardening Index del sistema operativo incrementado de ~58 a >82 puntos. |
| **Trivy (Imágenes)** | `trivy-baseline.txt` | `trivy-final.txt` | 0 vulnerabilidades CRITICAL y HIGH tras el uso de imágenes base fijas no-root. |
| **TestSSL (HTTPS)** | `testssl-baseline.txt` | `testssl-final.txt` | Calificación A; descarte total de TLS 1.0/1.1 y soporte obligatorio de Perfect Forward Secrecy. |
| **Gitleaks** | — | `gitleaks-final.sarif` | 0 secretos o credenciales detectadas en el árbol de Git. |

### Bono Opcional: Prueba de Carga y Resiliencia (+5 pts)
Se ejecutó la prueba de carga mediante [`scripts/load-test.sh`](../scripts/load-test.sh) simulando 100 usuarios concurrentes con ráfagas al endpoint `/api/auth/login`:
* **Resultado:** El Gateway mitigó la sobrecarga aplicando el Rate Limiting configurado (`limit_req_zone`), respondiendo con código HTTP 429 (*Too Many Requests*) a las peticiones excedentes y manteniendo la disponibilidad de la plataforma en un 100%.

---

## 7. Modelo de Responsabilidad Compartida en AWS

| Capa de Seguridad | Responsabilidad de AWS | Responsabilidad de Bryan y Johan (Equipo) |
| :--- | :--- | :--- |
| **Infraestructura Física** | Seguridad de centros de datos, servidores físicos, cables y energía. | N/A |
| **Virtualización y Red** | Hipervisor Nitro, aislamiento de VPC, hardware de almacenamiento EBS. | Configuración de tablas de rutas, subredes y reglas de Security Groups. |
| **Sistema Operativo (EC2)** | Disponibilidad de AMIs oficiales de Ubuntu/Debian. | Hardening de `/etc/ssh/sshd_config`, parches de seguridad, Fail2ban e iptables. |
| **Contenedores Docker** | N/A | Dockerfiles no-root, `cap_drop: ALL`, `read_only: true`, cuotas de CPU/RAM. |
| **Criptografía y Datos** | Módulos HSM de AWS KMS, durabilidad 99.999999999% de Amazon S3. | Gestión de llaves, cifrado de volúmenes EBS, certificados SSL/TLS y hash de contraseñas. |

---

## 8. Riesgos Residuales y Mejoras Futuras

1. **Riesgo Residual:** La base de datos y la aplicación residen en una misma instancia EC2 para ajustarse a los límites de créditos de AWS Academy Learner Lab.
   * *Mitigación:* Se implementó segmentación estricta de redes de Docker (`cemetery_db_net` con directiva `internal: true`), impidiendo que el motor de base de datos escuche en interfaces públicas.
2. **Mejora Futura:** Implementar un Web Application Firewall gestionado (**AWS WAF**) acoplado a un **Application Load Balancer (ALB)** para mitigación de ataques a nivel de capa 7 con inspección de reglas de reputación de IP.
