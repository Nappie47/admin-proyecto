# Checklist de Cumplimiento - Unidad 3

**Proyecto:** Administración de Redes - Unidad 3  
**Equipo:** _________________________  
**Fecha:** _________________________  

---

## PARTE A: Arquitectura de Red e Identidad Segura en GCP (20 pts)

### A.1 Red Virtual y Segmentación (8 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| VPC propia (no default) con subred pública y privada | ☐ | `terraform/modules/vpc` | |
| Subred pública: gateway/proxy (LB) | ☐ | `10.0.1.0/24` | |
| Subred privada: backend, BD, servicios internos | ☐ | `10.0.2.0/24` | |
| Tablas de rutas, Internet Gateway, NAT Gateway | ☐ | Cloud NAT + Cloud LB | |
| BD y backend sin IP pública, no alcanzables desde Internet | ☐ | Private IP only, Firewall deny | |
| Segmentación Docker (Unidad 2) ↔ Subredes VPC documentada | ☐ | `docs/seguridad-u3.md` Sección 2.1 | |
| Diagrama de red (CIDR, subredes, rutas, SG, flujos) | ☐ | `docs/arquitectura-gcp.drawio` | |

### A.2 Identidad y Control de Acceso - IAM (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Service Accounts con permisos mínimos | ☐ | `terraform/modules/iam` | |
| Instancias acceden a AWS/GCP via roles (instance profile/SA) | ☐ | Workload Identity + SA Cloud Run | |
| Sin llaves de acceso incrustadas en código/imágenes/env | ☐ | Secret Manager + Workload Identity | |
| Políticas justificadas y acotadas (evitar *) | ☐ | Custom roles en `terraform/modules/iam` | |
| Etiquetas (labels/tags) en recursos para identificación | ☐ | `labels` en todos los módulos Terraform | |

### A.3 Despliegue Reproducible y Control de Costos (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Alerta de presupuesto (Cloud Billing Budgets) | ☐ | `google_billing_budget` + alertas | |
| Procedimiento documentado para detener/eliminar recursos | ☐ | `docs/seguridad-u3.md` + scripts destroy | |
| Terraform para todo (Infrastructure as Code) | ☐ | `terraform/` completo | |

---

## PARTE B: Hardening de Instancia, Servicios y Contenedores (25 pts)

### B.1 Hardening de Acceso Remoto e Instancia (8 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Deshabilitar acceso root directo por SSH | ☐ | N/A (Cloud Run sin SSH) | N/A - Cloud Run serverless |
| Autenticación por llave pública (Ed25519), sin password | ☐ | Workload Identity / OIDC | |
| Restringir SSH por origen en SG (IP específica) o Session Manager | ☐ | N/A - Cloud Run | N/A |
| Fail2ban o equivalente | ☐ | Cloud Armor Rate Limiting | |
| Tiempos de espera, límite intentos, AllowUsers en sshd_config | ☐ | N/A - Cloud Run | N/A |
| Actualizaciones automáticas de SO y Docker | ☐ | Rebuild semanal automático + base images actualizadas | |

### B.2 Hardening de Servicios y Contenedores (9 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Ningún contenedor como root (salvo justificación) | ☐ | `USER nonroot` / `USER 1000` en Dockerfiles | |
| Capabilities drop ALL + solo necesarias | ☐ | `capabilities: { drop: ["ALL"] }` | |
| No-new-privileges | ☐ | `allowPrivilegeEscalation: false` | |
| Read-only filesystem cuando posible | ☐ | `readOnlyRootFilesystem: true` + tmpfs | |
| Límites CPU y memoria | ☐ | `cpu: "1000m", memory: "512Mi"` por servicio | |
| Sin modo privileged, sin socket Docker | ☐ | Cloud Run Gen2 no permite privileged | |
| Imágenes mínimas (distroless/alpine) | ☐ | `distroless/python3-debian12`, `nginx:alpine` | |

### B.3 Auditoría de Hardening e Imágenes (8 pts) - REQUISITO OBLIGATORIO
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Herramienta auditoría SO (Lynis/CIS-CAT) antes/después | ☐ | `lynis-report.txt` en `docs/evidencia/` | |
| Análisis vulnerabilidades imágenes (Trivy/Grype) antes/después | ☐ | `trivy-*.sarif` en `docs/evidencia/` | |
| Vulnerabilidades CRITICAL/HIGH reportadas antes/después | ☐ | `trivy-*-baseline.sarif` vs `trivy-*-final.sarif` | |
| Mejora medible documentada | ☐ | Comparativa en `docs/evidencia/despues/` | |
| Recomendaciones no aplicadas justificadas como riesgo aceptado | ☐ | Documentado en `docs/seguridad-u3.md` | |

---

## PARTE C: Criptografía, Gestión de Secretos y Protección de Datos (25 pts)

### C.1 Cifrado en Tránsito - HTTPS/TLS (8 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Redirección HTTP (80) → HTTPS (443) en LB | ☐ | HTTP forwarding rule → HTTPS target proxy | |
| Certificado Let's Encrypt/Certbot / Google-managed SSL / OpenSSL CA propia | ☐ | Google-managed SSL (auto-renew) | |
| Renovación automática + evidencia (simulación) | ☐ | Google-managed auto-renew (90 días) | |
| Endurecimiento TLS: SSLv3, TLS 1.0, 1.1 deshabilitados; solo 1.2, 1.3 | ☐ | SSL Policy `MODERN` | |
| Cipher suites seguras con Forward Secrecy | ☐ | SSL Policy MODERN + verificación testssl.sh | |
| Verificación con testssl.sh (o SSL Labs si público) | ☐ | `testssl-final.json` en evidencia | |
| Diagrama: dónde termina TLS, tramos internos cifrados/sin cifrar | ☐ | `docs/seguridad-u3.md` Sección 4.1 | |

### C.2 Gestión de Secretos y Llaves (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| gitleaks/trufflehog en repo completo + historial | ☐ | `gitleaks-final.sarif` en evidencia | |
| Rotación/reemplazo de secretos en caso de compromiso | ☐ | Secret Manager rotation (30 días) + docs | |

### C.3 Cifrado y Protección en Reposo (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Volúmenes EBS cifrados (KMS) - Cloud SQL/Storage CMEK | ☐ | Cloud SQL CMEK + Cloud Storage CMEK + Secret Manager CMEK | |
| Respaldos fuera de instancia (S3/Cloud Storage) con cifrado, versionado, bloqueo público, TLS | ☐ | Cloud Storage CMEK + versioning + uniform bucket access | |
| Procedimiento restauración demostrado | ☐ | `scripts/restore-test.sh` + evidencia | |
| Datos sensibles: protección adicional (campo cifrado, bcrypt/Argon2) | ☐ | Argon2id passwords + Envelope Encryption PII | |
| Inventario datos sensibles: clasificación, almacenamiento, protección, acceso | ☐ | Tabla en `docs/seguridad-u3.md` Sección 4.3 | |

### C.4 Mapa Criptográfico (REQUISITO OBLIGATORIO) (5 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Tabla con cada uso de criptografía: algoritmo, tipo, generación/almacenamiento llave, renovación | ☐ | `docs/seguridad-u3.md` Sección 4.4 + `mapa-criptografico.csv` | |

---

## PARTE D: Firewall y Seguridad Perimetral (20 pts)

### D.1 Security Groups / Firewall (8 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Security Groups/Firewall default-deny + reglas mínimas | ☐ | VPC Firewall default-deny (65534) + allow específicas | |
| Firewall host (UFW/iptables/nftables) default-deny, coherencia Docker | ☐ | N/A - Cloud Run maneja network stack | N/A - Cloud Run |
| Network ACLs como segunda capa (opcional) | ☐ | Hierarchical Firewall Policies | |
| Reglas documentadas en archivo/script reproducible | ☐ | `terraform/modules/vpc/main.tf` | |

### D.2 Evidencia Reducción Superficie de Ataque (7 pts) - REQUISITO OBLIGATORIO
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Escaneo externo (nmap desde Internet) antes/después | ☐ | `nmap-external-baseline.xml` vs `nmap-external-final.xml` | |
| Escaneo interno (nmap desde VM en VPC) antes/después | ☐ | `nmap-internal-baseline.xml` vs `nmap-internal-final.xml` | |
| Demostrar puertos/servicios innecesarios ya no expuestos | ☐ | Comparativa en `docs/evidencia/despues/` | |

---

## PARTE E: Validación, Evidencia y Documentación (10 pts)

### E.1 Validación y Evidencia Comparativa (6 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Cada medida Partes A-D con evidencia antes/después | ☐ | `docs/evidencia/antes/` vs `docs/evidencia/despues/` | |
| Evidencia reproducible: comando/procedimiento exacto | ☐ | `scripts/generar-evidencia.sh` | |
| Escaneos solo en infraestructura propia | ☐ | Solo recursos del equipo | |

### E.2 Documentación (4 pts)
| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Arquitectura final AWS/GCP + justificación | ☐ | `docs/seguridad-u3.md` Sección 2 | |
| Medidas hardening (instancia, remoto, servicios, contenedores) | ☐ | Sección 3 | |
| Configuración TLS/HTTPS, secretos, mapa criptográfico | ☐ | Secciones 4.1, 4.2, 4.4 | |
| Reglas firewall (SG, host) y segmentación resultante | ☐ | Sección 5 | |
| Evidencia comparativa antes/después cada medida | ☐ | `docs/evidencia/` estructura | |
| Modelo responsabilidad compartida aplicado | ☐ | Sección 7 | |
| Limitaciones, riesgos residuales, mejoras futuras | ☐ | Secciones 8 | |

---

## BONO OPCIONAL: Prueba de Carga Controlada (+5 pts)

| Requisito | Cumple | Evidencia | Observaciones |
|---|---|---|---|
| Prueba carga moderada (slowhttptest/hping3) contra recursos propios | ☐ | `scripts/load-test.sh` + resultados | |
| Ejecutada desde misma región, ajustada a políticas AWS/GCP | ☐ | Ejecutada desde misma región GCP | |

---

## TOTAL UNIDAD 3: ___ / 100 pts (+5 bono)

---

## Evaluación Transversal en Defensa (20 min)

| Criterio | Evaluación | Observaciones |
|---|---|---|
| Claridad de la presentación | ☐ | |
| Dominio técnico de ambos integrantes | ☐ | |
| Justificación técnica decisiones hardening/cripto | ☐ | |
| Capacidad responder preguntas/ajustes en vivo | ☐ | |

---

**Firma Integrante 1:** _________________________  
**Firma Integrante 2:** _________________________  
**Fecha:** _________________________  
**Nota Final:** _________________________