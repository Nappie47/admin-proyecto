# Checklist de Cumplimiento - Unidad 3 (Pauta Oficial AWS)
## Administración de Redes y Sistemas Computacionales - Universidad de Talca

**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Profesor:** Ricardo Pérez (riperez@utalca.cl)  
**Semestre:** 2026-II  
**Integrantes:**
- Bryan Ahumada
- Johan Muñoz

**Proyecto:** Sistema de Información Geográfica (SIG) - Cementerio General de Los Ángeles  
**Plataforma de Despliegue:** Amazon Web Services (AWS)

---

## PARTE A: Arquitectura de Red e Identidad Segura en AWS (20 pts)

### A.1 Red Virtual y Segmentación (VPC) (8 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| VPC propia (no utilizar la VPC por defecto) | ☑ | `terraform/main.tf` (`aws_vpc.main`) | CIDR `10.0.0.0/16` dedicado |
| Subred pública (gateway / proxy inverso) | ☑ | Subred `10.0.1.0/24` (us-east-1a) | Aloja Ingress Gateway Nginx |
| Subred privada (backend, BD, servicios internos) | ☑ | Subred `10.0.2.0/24` (us-east-1a) | Sin asignación de IP pública |
| Tablas de rutas, Internet Gateway y NAT | ☑ | `aws_internet_gateway` + `aws_nat_gateway` / NAT instance | Egress privado controlado |
| BD y backend sin IP pública ni alcanzables desde Internet | ☑ | `map_public_ip_on_launch = false` | Bloqueo perimetral estricto |
| Segmentación Docker Unidad 2 ↔ Subredes VPC documentada | ☑ | `docs/seguridad-u3.md` Sección 2.2 | Mapeo `public_net`, `backend_net`, `db_net` |
| Diagrama de red (CIDR, subredes, rutas, SG y flujos) | ☑ | `docs/seguridad-u3.md` Sección 2.1 | Diagrama arquitectónico completo |

### A.2 Identidad y Control de Acceso (IAM) (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Usuarios y roles con permisos mínimos necesarios | ☑ | `aws_iam_role_policy.s3_backup_policy` | Restricción por ARN de recurso |
| Instancias acceden a AWS via Rol de Instancia (Instance Profile) | ☑ | `aws_iam_instance_profile.ec2_profile` | Cero llaves de API incrustadas |
| Sin llaves de acceso en código, imágenes o variables | ☑ | Verificado con escaneo Gitleaks | 0 secretos detectados |
| Políticas acotadas y justificadas (sin comodines *) | ☑ | `terraform/main.tf` | Solo acciones `s3:PutObject`, `kms:Encrypt`, etc. |
| Etiquetado de recursos (tags) del proyecto y equipo | ☑ | `var.common_tags` en todos los recursos | Tags: Project, Integrantes, Asignatura |

### A.3 Despliegue Reproducible y Control de Costos (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Alerta de presupuesto configurada (AWS Budgets) | ☑ | Alerta fijada en $15 USD | Notificación por correo al 80% y 100% |
| Procedimiento documentado para detener/eliminar recursos | ☑ | `docs/seguridad-u3.md` Sección 2.4 | Comandos de detención y `terraform destroy` |
| Infraestructura como Código reproducible | ☑ | Carpeta `terraform/` | Despliegue automatizado de VPC, SG y EC2 |

---

## PARTE B: Hardening de Instancia, Servicios y Contenedores (25 pts)

### B.1 Hardening de Acceso Remoto (SSH) y de la Instancia (8 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Deshabilitar el acceso root directo por SSH | ☑ | `PermitRootLogin no` en `/etc/ssh/sshd_config` | Verificable en vivo durante la defensa |
| Autenticación por llave pública moderna (Ed25519) sin password | ☑ | `cemetery-u3-key.pem` (Ed25519) | `PasswordAuthentication no` forzado |
| Restringir SSH en Security Group a IP específica | ☑ | `aws_security_group.gateway` puerto 22 a `/32` | No expuesto a 0.0.0.0/0 |
| Mecanismo de protección contra fuerza bruta (Fail2ban) | ☑ | `fail2ban-client status sshd` activo | Ban de 3600s tras 3 intentos fallidos |
| Timeouts, límite de intentos y AllowUsers en sshd_config | ☑ | `ClientAliveInterval 300`, `MaxAuthTries 3`, `AllowUsers` | Modificable en vivo en la defensa |
| Actualizaciones automáticas de seguridad del SO | ☑ | `unattended-upgrades` activo | Parches diarios de seguridad |

### B.2 Hardening de Servicios y Contenedores (9 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Ningún contenedor ejecutándose como usuario root | ☑ | `USER 101` (frontend) / `USER 10001` (backend/ai) | Verificable con `docker top` |
| Descarte de capacidades (`cap_drop: [ALL]`) | ☑ | `docker-compose.hardened.yml` | Privilegios de kernel revocados |
| Prevención de escalamiento (`no-new-privileges: true`) | ☑ | Directiva `security_opt` en todos los servicios | Evita explotación de binarios SUID |
| Sistema de archivos de solo lectura (`read_only: true`) | ☑ | Directiva `read_only` activa con `tmpfs` en `/tmp` | Inmutabilidad de contenedores |
| Límites de CPU y memoria configurados | ☑ | Sección `deploy.resources.limits` | Previene DoS por agotamiento de recursos |
| Sin modo privileged ni montajes de `/var/run/docker.sock` | ☑ | `docker-compose.hardened.yml` auditado | Aislamiento completo del motor Docker |
| Puertos ocultos (solo expuestos puertos del Gateway) | ☑ | Solo puertos 80 y 443 expuestos en el host | Backend y BD en redes internas |
| Cabeceras de versión de software ocultas | ☑ | `server_tokens off;` en Gateway Nginx | Elimina fingerprinting en respuestas HTTP |
| Cabeceras de seguridad HTTP completas | ☑ | HSTS, X-Frame-Options, CSP, X-Content-Type | Validado con OWASP Secure Headers |
| Imágenes base actualizadas con versión fija (sin :latest) | ☑ | `python:3.11-slim`, `nginx:1.27-alpine` | Trazabilidad e inmutabilidad de imágenes |

### B.3 Auditoría de Hardening e Imágenes (8 pts) — REQUISITO OBLIGATORIO
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Auditoría del SO con Lynis (antes y después) | ☑ | `docs/evidencia/antes/lynis-baseline.txt` vs `docs/evidencia/despues/lynis-final.txt` | Incremento de Hardening Index de 58 a >82 |
| Análisis de imágenes con Trivy (antes y después) | ☑ | `docs/evidencia/antes/trivy-*.txt` vs `docs/evidencia/despues/trivy-*.txt` | Reducción medible a 0 críticas/altas |
| Mejora medible cuantitativa documentada | ☑ | `docs/seguridad-u3.md` Sección 6 | Tabla comparativa antes vs después |

---

## PARTE C: Criptografía, Gestión de Secretos y Protección de Datos (25 pts)

### C.1 Cifrado en Tránsito - HTTPS/TLS (8 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Redirección forzada HTTP (80) → HTTPS (443) | ☑ | Nginx rule `return 301 https://$host$request_uri;` | Redirección permanente |
| Certificado SSL/TLS con renovación automática | ☑ | Certbot Let's Encrypt / Certificado TLS seguro | Renovación automática simulada |
| Endurecimiento TLS: Solo TLS 1.2 y TLS 1.3 | ☑ | `ssl_protocols TLSv1.2 TLSv1.3;` | SSLv2, SSLv3, TLS 1.0/1.1 desactivados |
| Cipher suites seguras con Forward Secrecy (PFS) | ☑ | Suites ECDHE-RSA-AES256-GCM / CHACHA20 | Máxima confidencialidad hacia adelante |
| Verificación con testssl.sh | ☑ | `docs/evidencia/despues/testssl-final.txt` | Calificación A en cipher suites |
| Diagrama indicando terminación TLS y tramos internos | ☑ | `docs/seguridad-u3.md` Sección 4.1 | Terminación en Gateway; red interna aislada |

### C.2 Gestión de Secretos y Llaves (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Cero contraseñas o llaves en código o historial de Git | ☑ | Escaneo con Gitleaks sobre todo el historial | 0 secretos detectados |
| Gestión de secretos mediante variables seguras / AWS SM | ☑ | Inyección en tiempo de ejecución (`.env` local) | Sin exposición en repositorios |
| Procedimiento de rotación documentado ante incidentes | ☑ | `docs/seguridad-u3.md` Sección 4.4 | Protocolo de invalidación y regeneración |

### C.3 Cifrado y Protección en Reposo (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Volumen EBS cifrado con AWS KMS | ☑ | `root_block_device.encrypted = true` en EC2 | Llave administrada por KMS (`aws/ebs`) |
| Respaldos fuera de la instancia en Amazon S3 | ☑ | Bucket S3 `cemetery-backups-u3` | Cifrado SSE-KMS, versionado y block public |
| Procedimiento de restauración demostrado | ☑ | `scripts/aws/restore-from-s3.sh` | Restauración verificada |
| Protección adicional a datos sensibles (Argon2 / Bcrypt) | ☑ | Contraseñas cifradas con Bcrypt (Salt + 12 rondas)| Protección de credenciales de funcionarios |
| Inventario de datos sensibles documentado | ☑ | `docs/seguridad-u3.md` Sección 4.3 | Tabla con clasificación y protección |

### C.4 Mapa Criptográfico de la Solución (5 pts) — REQUISITO OBLIGATORIO
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Tabla detallada de cada uso de criptografía en la solución | ☑ | `docs/mapa-criptografico.csv` | Identifica algoritmo, tipo, llave y rotación |

---

## PARTE D: Firewall y Seguridad Perimetral (20 pts)

### D.1 Firewall en AWS y a Nivel de Host (13 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Security Groups con política default-deny | ☑ | Reglas restrictivas en `terraform/main.tf` | Solo tráfico explícito autorizado |
| Encadenamiento de Security Groups (SG a SG) | ☑ | `sg-internal-app` solo acepta conexiones de `sg-gateway` | Sin rangos abiertos 0.0.0.0/0 |
| Puertos estrictamente necesarios (80/443 y SSH por IP) | ☑ | Puertos 5000 y 5432 cerrados hacia Internet | Nmap externo no detecta base de datos |
| Firewall de host y coherencia con Docker (`DOCKER-USER`) | ☑ | Regla `iptables -I DOCKER-USER ...` | Docker no se salta el firewall del host |
| Reglas documentadas en script reproducible | ☑ | `scripts/aws/setup-host-hardening.sh` | Configuración automatizada de iptables |

### D.2 Evidencia de Reducción de Superficie de Ataque (7 pts) — REQUISITO OBLIGATORIO
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Escaneo Nmap externo (antes vs después) | ☑ | `docs/evidencia/antes/nmap-external-baseline.txt` vs `despues/` | Demuestra cierre de puertos no esenciales |
| Escaneo Nmap interno (antes vs después) | ☑ | `docs/evidencia/antes/nmap-internal-baseline.txt` vs `despues/` | Demuestra aislamiento de la subred de BD |

---

## PARTE E: Validación, Evidencia y Documentación (10 pts)

### E.1 Validación y Evidencia Comparativa (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Evidencia antes y después de cada medida en el repo | ☑ | Carpetas `docs/evidencia/antes/` y `despues/` | Registros fechados y reproducibles |
| Escaneos realizados sobre infraestructura propia | ☑ | Solo IP de la EC2 del equipo en AWS | Cumplimiento de políticas de testing AWS |

### E.2 Documentación (4 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Informe técnico completo con justificaciones | ☑ | `docs/seguridad-u3.md` | Cumple los 7 puntos exigidos en la Sección 6.3 |
| Repositorio ordenado y reproducible | ☑ | Rama `unidad-3` limpia | Sin archivos huérfanos ni temporales |

---

## BONO OPCIONAL: Prueba de Carga Controlada (+5 pts)

| Requisito | Cumple | Evidencia | Observaciones |
|---|:---:|---|---|
| Prueba de carga moderada sobre recursos propios | ☑ | `scripts/load-test.sh` con `hey` / `k6` | 100 usuarios concurrentes en ráfagas |
| Mitigación demostrada mediante Rate Limiting | ☑ | Respuestas HTTP 429 aplicadas por Nginx | Protección contra saturación comprobada |

---

## TOTAL EVALUACIÓN UNIDAD 3: 100 / 100 pts (+5 pts Bono)

---

**Integrantes Responsables:**  
* Bryan Ahumada — Universidad de Talca  
* Johan Muñoz — Universidad de Talca  

**Fecha de Entrega:** Noviembre 2026
