# Documentación Unidad 3: Hardening, Criptografía y Seguridad Perimetral en Google Cloud Run

**Proyecto:** Administración de Redes y Sistemas Computacionales  
**Semestre:** 2026-II  
**Profesor:** Ricardo Pérez  
**Equipo:** [Nombres de los integrantes]

---

## 1. Introducción

Esta documentación describe la implementación de las medidas de seguridad requeridas en la Unidad 3 del proyecto integrador de Administración de Redes, adaptadas para desplegar en **Google Cloud Platform (GCP)** utilizando **Cloud Run** como plataforma serverless de contenedores.

La solución mantiene toda la funcionalidad de las Unidades 1 y 2 (API, Frontend, Componente de IA, Monitoreo, Respaldo) reforzando la seguridad mediante hardening de contenedores, criptografía aplicada, gestión de secretos y control perimetral en la nube.

---

## 2. Arquitectura Final en GCP

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VPC NETWORK (Custom Mode)                          │
│  ┌─────────────────────────────┐    ┌──────────────────────────────────┐   │
│  │      SUBRED PÚBLICA         │    │       SUBRED PRIVADA              │   │
│  │  10.0.1.0/24 (us-central1)  │    │  10.0.2.0/24 (us-central1)       │   │
│  │                             │    │                                   │   │
│  │  • Cloud Load Balancer      │    │  • Cloud Run Services            │   │
│  │    (HTTPS + Cloud Armor)    │    │    - api-service                 │   │
│  │  • Cloud NAT (Egress)       │    │    - frontend-service            │   │
│  │  • Firewall: Allow 80/443   │    │    - ai-service                  │   │
│  │    from LB Health Checks    │    │  • Cloud SQL (PostgreSQL 15)     │   │
│  │  • Serverless VPC Connector │    │    (CMEK, Private IP, SSL)       │   │
│  │    (acceso a recursos priv) │    │  • Redis (Memorystore)           │   │
│  │                             │    │    (Auth + TLS)                   │   │
│  └─────────────────────────────┘    └──────────────────────────────────┘   │
│                                                                             │
│  Cloud Armor (WAF) ──► Cloud Load Balancer ──► Cloud Run Services          │
│       │                                                    │               │
│       ▼                                                    ▼               │
│  Cloud Armor WAF                                    VPC Connector        │
│  (OWASP + Rate Limiting)                            (acceso a BD/Redis)   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Componentes y Justificación

| Componente | Servicio GCP | Justificación |
|---|---|---|
| **Compute** | Cloud Run (Gen2) | Serverless, auto-scaling, sin gestión de infraestructura, billing por uso |
| **Red** | VPC Custom + Subredes | Segmentación pública/privada, control total sobre CIDR |
| **Ingress** | Cloud Load Balancer (Global External HTTP(S)) | SSL termination, CDN, Cloud Armor integration, IPv4/IPv6 |
| **WAF** | Cloud Armor | OWASP CRS, Rate limiting, DDoS protection, Reglas custom |
| **Egress** | Cloud NAT | Egress controlado desde subred privada, sin IP pública en servicios |
| **Base de Datos** | Cloud SQL (PostgreSQL 15) | Managed, CMEK, Private IP, SSL obligatorio, PITR, Backups automáticos |
| **Cache/Sessions** | Memorystore Redis | Managed, Auth + TLS, HA opcional |
| **Secretos** | Secret Manager | Rotación automática, CMEK, Versionado, Auditoría |
| **Cifrado** | Cloud KMS | CMEK para Cloud SQL, Cloud Storage, Secret Manager |
| **Identidad** | IAM + Workload Identity | Least privilege, sin credenciales en código, OIDC para GitHub Actions |
| **SSL/TLS** | Google-managed SSL Certs | Renovación automática, TLS 1.2/1.3, Cipher suites seguros |
| **Monitoreo** | Cloud Monitoring + Logging | Alertas, Uptime checks, Log sinks, Dashboards |
| **CI/CD** | Cloud Build + Artifact Registry | Security scanning integrado, Vulnerability scanning, SBOM |

### 2.3 Migración desde Unidades 1 y 2

La solución de las Unidades 1 y 2 (Docker Compose local) se migró a GCP mediante:

1. **Containerización**: Cada servicio (API, Frontend, AI) en su propia imagen Docker hardened
2. **Orquestación**: De Docker Compose → Cloud Run services independientes
3. **Red**: De redes Docker bridge → VPC Subredes + VPC Connector
4. **Persistencia**: De volúmenes Docker → Cloud SQL (BD) + Cloud Storage (Backups)
5. **Secretos**: De variables de entorno/.env → Secret Manager + Workload Identity
6. **SSL**: De Certbot/Let's Encrypt local → Google-managed SSL Certificates
7. **Firewall**: De UFW/iptables local → VPC Firewall Rules + Cloud Armor

---

## 3. Medidas de Hardening Aplicadas

### 3.1 Hardening de Contenedores (Cloud Run)

| Medida | Implementación | Verificación |
|---|---|---|
| **Usuario non-root** | `USER nonroot:nonroot` (distroless) / `USER 1000` (custom) | `ps aux` en contenedor, Container Structure Test |
| **Read-only root filesystem** | `readOnlyRootFilesystem: true` + `emptyDir` para `/tmp` | `mount \| grep ro` |
| **Capabilities drop ALL** | `capabilities: { drop: ["ALL"] }` | `capsh --print` → `Current: =ep` |
| **No privilege escalation** | `allowPrivilegeEscalation: false` | `/proc/self/status` → `NoNewPrivs: 1` |
| **CPU/Memory limits** | `cpu: "1000m", memory: "512Mi"` (por servicio) | `kubectl describe` / Cloud Run console |
| **No privileged mode** | Por defecto en Cloud Run Gen2 | N/A (no permitido) |
| **Imágenes base mínimas** | `distroless/python3-debian12` / `nginx:alpine` | `trivy image` → 0 vulnerabilidades CRITICAL/HIGH |
| **Multi-stage builds** | Builder → Runtime (solo runtime deps) | Tamaño imagen < 100MB |

**Dockerfile API (ejemplo):**
```dockerfile
# Builder stage
FROM python:3.11-alpine AS builder
RUN apk add --no-cache gcc musl-dev libffi-dev openssl-dev
RUN python -m venv /opt/venv && /opt/venv/bin/pip install -r requirements.txt

# Runtime stage - Distroless nonroot
FROM gcr.io/distroless/python3-debian12:nonroot
COPY --from=builder /opt/venv /opt/venv
COPY --chown=nonroot:nonroot app/ /app/
ENV PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1
USER nonroot:nonroot
EXPOSE 8080
HEALTHCHECK CMD ["python", "-c", "urllib.request.urlopen('http://localhost:8080/health')"]
ENTRYPOINT ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 3.2 Hardening de Acceso Remoto (No aplica SSH directo)

Cloud Run no expone SSH. El acceso se realiza mediante:
- **Cloud Run Console/CLI** para logs/debug
- **Cloud Build** para deployments
- **Workload Identity** para autenticación OIDC desde CI/CD

### 3.3 Hardening de Servicios

| Servicio | Configuración |
|---|---|
| **Nginx (Frontend)** | `server_tokens off`, Security Headers (CSP, HSTS, X-Frame-Options), Rate limiting (100r/s API, 5r/s login), TLS termination en LB |
| **API (Python/FastAPI)** | Security headers middleware, Rate limiting, Input validation, JWT auth |
| **AI Service** | Modelo en `/app/models` (read-only), No GPU en versión ligera, Resource limits 2CPU/2Gi |

### 3.3 Auditoría de Hardening e Imágenes

| Herramienta | Qué audita | Frecuencia | Evidencia |
|---|---|---|---|
| **Trivy** | Vulnerabilidades CRITICAL/HIGH en imágenes | Cada build + Semanal | `trivy-api.sarif` en `gs://bucket/security-reports/` |
| **Grype** | Vulnerabilidades alternativa | Cada build | `grype-report.txt` |
| **Lynis** | Hardening SO (en contenedor temporal) | Semanal (Cloud Build audit) | `lynis-report.txt` |
| **Gitleaks** | Secretos en repo + historial | Cada commit + Semanal | `gitleaks-report.sarif` |
| **Container Structure Test** | Configuración contenedor (non-root, caps, etc) | Cada build | `structure-test-report.json` |
| **Syft** | SBOM (Software Bill of Materials) | Cada build | `sbom-api.spdx.json` |
| **Cosign** | Verificación firma imágenes | Cada deploy | `cosign verify` output |

**Pipeline de Auditoría (Cloud Build):**
```yaml
# cloudbuild-audit.yaml (ejecutado semanal)
steps:
  - name: aquasec/trivy:latest
    args: ['image', '--severity', 'HIGH,CRITICAL', '--format', 'sarif', '--output', 'trivy-api.sarif', '${_ARTIFACT_REGISTRY}/api:latest']
  - name: zricethezav/gitleaks:latest
    args: ['detect', '--source', '/workspace', '--report-format', 'sarif', '--report-path', 'gitleaks.sarif']
  - name: cisofy/lynis:latest
    args: ['audit', 'system', '--quick']
  - name: anchore/syft:latest
    args: ['${_ARTIFACT_REGISTRY}/api:latest', '-o', 'spdx-json=sbom-api.spdx.json']
```

---

## 4. Criptografía, Gestión de Secretos y Protección de Datos

### 4.1 Cifrado en Tránsito (HTTPS/TLS)

| Componente | Configuración |
|---|---|
| **Terminación TLS** | Cloud Load Balancer (Global External HTTP(S) LB) |
| **Certificados** | Google-managed SSL Certificates (renovación automática 90 días) |
| **SSL Policy** | `MODERN` → TLS 1.2 + 1.3 only, Cipher suites con Forward Secrecy |
| **Redirección HTTP→HTTPS** | LB HTTP forwarding rule → HTTPS target proxy (301 redirect) |
| **HSTS** | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| **OCSP Stapling** | Habilitado en LB |
| **Verificación** | `testssl.sh` contra dominio público |

**SSL Policy (Terraform):**
```hcl
resource "google_compute_ssl_policy" "policy" {
  name        = "unidad3-ssl-policy"
  profile     = "MODERN"  # TLS 1.2 + 1.3 only
  min_tls_version = "TLS_1_2"
  custom_features = []
}
```

### 4.2 Gestión de Secretos y Llaves

| Secreto | Almacenamiento | Rotación | Acceso |
|---|---|---|---|
| **DB Password** | Secret Manager (CMEK) | 30 días | Cloud Run SA via Secret Manager API |
| **JWT Secret** | Secret Manager (CMEK) | 30 días | Cloud Run SA |
| **Redis Password** | Secret Manager (CMEK) | 30 días | Cloud Run SA |
| **API Keys** | Secret Manager (CMEK) | 90 días | Cloud Run SA |
| **Certificados TLS** | Google-managed SSL / Let's Encrypt | Auto (90 días) | LB managed |

**Configuración Secret Manager (Terraform):**
```hcl
resource "google_secret_manager_secret" "db_password" {
  secret_id = "unidad3-db-password"
  replication { automatic = true }
  customer_managed_encryption {
    kms_key_name = google_kms_crypto_key.keys["secrets"].id
  }
  rotation {
    rotation_period = "2592000s"  # 30 días
  }
}
```

**Detección de secretos en CI/CD:**
```bash
# Gitleaks en Cloud Build
gitleaks detect --source /workspace --report-format sarif --report-path gitleaks.sarif
```

### 4.3 Cifrado y Protección de Información en Reposo

| Recurso | Cifrado | Implementación |
|---|---|---|
| **Cloud SQL (PostgreSQL)** | CMEK (Cloud KMS) | `encryption_configuration { kms_key_name = ... }` |
| **Cloud Storage (Backups/Static)** | CMEK (Cloud KMS) | `default_kms_key_name` en bucket |
| **Secret Manager** | CMEK (Cloud KMS) | `customer_managed_encryption { kms_key_name }` |
| **Discos Cloud Run** | Google-managed (default) | N/A (serverless) |
| **Redis (Memorystore)** | Google-managed + TLS en tránsito | `transit_encryption_mode = "SERVER_AUTHENTICATION"` |

**Protección a nivel de aplicación (datos sensibles):**
```python
# Contraseñas: Argon2id
from passlib.hash import argon2
hash = argon2.hash(password)
verify = argon2.verify(password, hash)

# Datos sensibles (PII, documentos): Envelope Encryption
from google.cloud import kms
def encrypt_field(plaintext, key_name):
    client = kms.KeyManagementServiceClient()
    response = client.encrypt(request={"name": key_name, "plaintext": plaintext.encode()})
    return base64.b64encode(response.ciphertext).decode()

def decrypt_field(ciphertext_b64, key_name):
    client = kms.KeyManagementServiceClient()
    response = client.decrypt(request={"name": key_name, "ciphertext": base64.b64decode(ciphertext_b64)})
    return response.plaintext.decode()
```

### 4.4 Inventario de Datos Sensibles

| Dato | Clasificación | Almacenamiento | Protección Tránsito | Protección Reposo | Acceso |
|---|---|---|---|---|---|
| **Contraseñas usuarios** | Crítica | Cloud SQL (hash Argon2id) | TLS 1.3 | Hash irreversible | Solo app (verificación) |
| **Tokens JWT** | Alta | Secret Manager | TLS 1.3 | CMEK (KMS) | Cloud Run SA |
| **Datos personales (Ley 19.628)** | Alta | Cloud SQL (campos cifrados) | TLS 1.3 | CMEK + Envelope Encryption | App (decrypt on access) |
| **Documentos usuarios** | Alta | Cloud Storage (CMEK) | TLS 1.3 | CMEK (KMS) | App (signed URLs) |
| **API Keys externos** | Alta | Secret Manager | TLS 1.3 | CMEK (KMS) | Cloud Run SA |
| **DB Password** | Crítica | Secret Manager | TLS 1.3 | CMEK (KMS) | Cloud Run SA |
| **Redis Password** | Alta | Secret Manager | TLS 1.3 | CMEK (KMS) | Cloud Run SA |

### 4.4 Mapa Criptográfico de la Solución

| Uso | Algoritmo/Mecanismo | Tipo | Generación/Almacenamiento Llave | Renovación |
|---|---|---|---|---|
| **TLS/HTTPS (LB)** | TLS 1.3, AES_256_GCM | Simétrica (sesión) / Asimétrica (cert) | Google-managed SSL / Let's Encrypt | Auto (90 días) |
| **Workload Identity / OIDC** | OIDC / mTLS | Asimétrica | Google-managed / SA keys | Auto (rotación SA keys) |
| **Secret Manager** | AES-256-GCM | Simétrica | Google-managed / CMEK (Cloud KMS) | Configurable (30 días) |
| **Cloud SQL (CMEK)** | AES-256 | Simétrica | Cloud KMS CryptoKey | Rotación automática KMS (30 días) |
| **Cloud Storage (CMEK)** | AES-256 | Simétrica | Cloud KMS CryptoKey | Rotación automática KMS |
| **Contraseñas BD** | Argon2id | Hash | Generado en app, almacenado hash | Re-hash en login |
| **JWT/Session tokens** | RS256 / HS256 | Asimétrica/Simétrica | Cloud KMS / Secret Manager | Rotación 24h-7d |
| **Envelope Encryption (PII)** | AES-256-GCM + KMS | Híbrida | DEK en app, KEK en Cloud KMS | Rotación KEK anual |

---

## 5. Firewall y Seguridad Perimetral

### 5.1 VPC Firewall Rules (Default-Deny)

| Regla | Prioridad | Dirección | Acción | Puertos | Origen | Destino (Tags) |
|---|---|---|---|---|---|---|
| **Default Deny Ingress** | 65534 | INGRESS | DENY | All | 0.0.0.0/0 | All |
| **Default Deny Egress** | 65534 | EGRESS | DENY | All | All | All |
| **Allow LB HTTPS** | 1000 | INGRESS | ALLOW | 443 | 35.191.0.0/16, 130.211.0.0/22 | `cloud-run` |
| **Allow LB HTTP** | 1000 | INGRESS | ALLOW | 80 | 35.191.0.0/16, 130.211.0.0/22 | `cloud-run` |
| **Allow Health Checks** | 1000 | INGRESS | ALLOW | 80,443,8080 | Google health check ranges | `cloud-run` |
| **Allow Private Services** | 1000 | INGRESS | ALLOW | 5432,6379 | `cloud-run`, `vpc-connector` | `cloud-sql`, `redis` |
| **Allow Internal Private** | 2000 | INGRESS | ALLOW | All | 10.0.2.0/24 | `private-service` |
| **Allow Google APIs** | 1000 | EGRESS | ALLOW | 443 | `cloud-run` | Google APIs IPs |
| **Allow DNS** | 1000 | EGRESS | ALLOW | 53 (UDP/TCP) | All internal | - |
| **Allow NTP** | 1000 | EGRESS | ALLOW | 123 (UDP) | All internal | - |

**Principio:** Default-deny en ambas direcciones, reglas allow explícitas por tags.

### 5.2 Cloud Armor (WAF)

```hcl
# Políticas habilitadas
- OWASP CRS Ruleset (100+ reglas)
- Rate Limiting: 1000 req/min por IP
- Custom Rules:
  - Block SQL injection patterns
  - Block XSS attempts
  - Block scanner user agents (sqlmap, nikto, nmap)
  - Block sensitive paths (.git, .env, wp-admin, phpmyadmin)
- Adaptive Protection (DDoS)
```

### 5.3 Cloud NAT (Egress Controlado)

```hcl
resource "google_compute_router_nat" "nat" {
  name                               = "unidad3-nat"
  router                             = google_compute_router.router.name
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETS_ALL_PRIMARY_IP_RANGES"
  min_ports_per_vm                   = 64
  log_config { enable = true, filter = "ALL" }
}
```

### 5.4 Evidencia de Reducción de Superficie de Ataque

| Escaneo | Antes (Baseline) | Después (Hardening) |
|---|---|---|
| **Externo (nmap -sS)** | Puertos: 22, 80, 443, 8080, 5432, 6379, 8081 | Puertos: 80 (redirect), 443 únicamente |
| **Interno (nmap -sT desde VM en VPC)** | Todos los puertos internos accesibles | Solo puertos necesarios entre tags (API→DB, API→Redis) |
| **testssl.sh** | TLS 1.0, 1.1, 1.2, Cipher suites débiles | TLS 1.2/1.3 only, Forward Secrecy, HSTS |
| **Cloud Armor** | Sin WAF | OWASP CRS + Rate limiting + Custom rules |

**Comandos de evidencia:**
```bash
# Escaneo externo
nmap -sS -p 1-65535 --open -oX nmap-external.xml <LB_IP>

# Escaneo interno (desde VM bastion en VPC)
nmap -sT -p 1-65535 --open -oX nmap-internal.xml <INTERNAL_IP>

# Verificación TLS
testssl.sh --jsonfile testssl-report.json https://api.dominio.com

# Verificar firewall rules
gcloud compute firewall-rules list --format=json
```

---

## 6. Validación, Evidencia y Documentación

### 6.1 Estructura de Evidencia (Repositorio)

```
docs/
├── seguridad-u3.md              # Este documento
├── arquitectura-gcp.drawio      # Diagrama arquitectura
├── mapa-criptografico.csv       # Mapa criptográfico
├── checklist-unidad3.md         # Checklist de cumplimiento
└── evidencia/
    ├── antes/                    # Baseline (despliegue inicial sin hardening)
    │   ├── nmap-external.xml
    │   ├── nmap-internal.xml
    │   ├── trivy-api-baseline.sarif
    │   ├── sshd_config-baseline
    │   ├── ssl-config-baseline
    │   └── firewall-rules-baseline.json
    └── despues/                  # Post-hardening
        ├── nmap-external.xml
        ├── nmap-internal.xml
        ├── trivy-api-final.sarif
        ├── trivy-frontend-final.sarif
        ├── trivy-ai-final.sarif
        ├── lynis-report.txt
        ├── gitleaks-final.sarif
        ├── testssl-final.json
        ├── nmap-external-final.xml
        ├── nmap-internal-final.xml
        ├── firewall-rules-final.json
        ├── iam-policies.json
        ├── kms-keys.json
        ├── cloudrun-config.json
        ├── cloud-armor-policy.json
        └── testssl-final.json
```

### 6.2 Comandos para Generar Evidencia (Reproducibles)

```bash
#!/bin/bash
# scripts/generar-evidencia.sh

OUTPUT_DIR="docs/evidencia/despues/$(date +%Y%m%d)"
mkdir -p "$OUTPUT_DIR"

# Terraform outputs
terraform output -json > $OUTPUT_DIR/terraform-outputs.json

# Firewall rules
gcloud compute firewall-rules list --format=json > $OUTPUT_DIR/firewall-rules.json

# IAM policies
gcloud projects get-iam-policy $PROJECT_ID --format=json > $OUTPUT_DIR/iam-policies.json

# Cloud Run configs
for svc in api frontend ai-service; do
  gcloud run services describe unidad3-${svc}-${SUFFIX} --region=$REGION --format=json > $OUTPUT_DIR/cloudrun-${svc}.json
done

# Cloud Armor
gcloud compute security-policies describe unidad3-armor-policy --format=json > $OUTPUT_DIR/cloud-armor-policy.json

# Secret Manager
gcloud secrets list --format=json > $OUTPUT_DIR/secrets.json

# KMS Keys
gcloud kms keys list --keyring=unidad3-keyring --location=global --format=json > $OUTPUT_DIR/kms-keys.json

# Cloud SQL
gcloud sql instances describe unidad3-db-${SUFFIX} --format=json > $OUTPUT_DIR/cloudsql-config.json

# Escaneos nmap
nmap -sS -p 1-65535 --open -oX $OUTPUT_DIR/nmap-external.xml <LB_IP>
nmap -sT -p 1-65535 --open -oX $OUTPUT_DIR/nmap-internal.xml <INTERNAL_IP>

# TLS verification
testssl.sh --jsonfile $OUTPUT_DIR/testssl.json https://api.dominio.com

# Trivy scans
trivy image --format json --output trivy-api.json ${ARTIFACT_REGISTRY}/api:latest
trivy image --format json --output trivy-frontend.json ${ARTIFACT_REGISTRY}/frontend:latest
trivy image --format json --output trivy-ai.json ${ARTIFACT_REGISTRY}/ai-service:latest

# Gitleaks
gitleaks detect --source . --report-format json --report-path gitleaks-report.json
```

---

## 7. Modelo de Responsabilidad Compartida (GCP)

| Capa | Responsabilidad de GCP | Responsabilidad del Equipo |
|---|---|---|
| **Física** | Data centers, hardware, red física | - |
| **Red** | Backbone global, Cloud Load Balancer, Cloud Armor, Cloud NAT | VPC design, Firewall rules, Cloud Armor policies, NAT config |
| **Host/OS** | Hypervisor, Host OS, Container runtime (gVisor) | Container image hardening, Base image selection |
| **Contenedor** | Sandbox (gVisor), Network isolation | Imagen hardened, Non-root, Capabilities drop, Read-only FS, Resource limits |
| **Aplicación** | - | Código seguro, Input validation, AuthZ/AuthN, Rate limiting, Security headers |
| **Datos** | Encriptación en reposo (default), KMS managed | CMEK config, Envelope encryption, Key rotation, Data classification |
| **Identidad** | IAM, Workload Identity, Org Policies | Least privilege SA, Custom roles, Workload Identity Federation |
| **Red** | Global network, LB, Cloud Armor, Cloud NAT | VPC design, Firewall rules, Cloud Armor policies, SSL Policy |
| **Monitoreo** | Infraestructura de monitoring | Alertas, Dashboards, Log sinks, Uptime checks |

---

## 8. Limitaciones, Riesgos Residuales y Mejoras Futuras

### 8.1 Limitaciones del Entorno GCP Utilizado

| Limitación | Impacto | Mitigación |
|---|---|---|
| **Cloud Run Gen2 shared tenancy** | Aislamiento a nivel de contenedor (gVisor), no VM dedicada | gVisor proporciona fuerte aislamiento; no se requiere VM dedicada |
| **Google-managed SSL Certs** | No control total sobre certificado (sin pinning custom) | SSL Policy MODERN + monitoreo expiración |
| **Cloud Armor WAF** | Reglas predefinidas, no ML/IA avanzado | Reglas custom + Rate limiting + Adaptive Protection |
| **Cloud Run scaling to zero** | Cold starts en primer request | `min_instances > 0` para servicios críticos |
| **VPC Connector throughput** | Límite de ancho de banda según instancias | Dimensionar connector según carga esperada |
| **Cloud SQL Private IP** | Requiere Private Service Connect / VPC Peering | Configurado correctamente en Terraform |
| **Free Tier / Créditos** | Límites de cuota | Monitoreo de cuotas + alertas de billing |

### 8.2 Riesgos Residuales Identificados

| Riesgo | Probabilidad | Impacto | Estado |
|---|---|---|---|
| **Fuga de secretos via repo** | Baja | Crítico | Mitigado: Gitleaks en CI/CD + Secret Manager + Rotación |
| **Vulnerabilidad 0-day en imagen base** | Media | Alto | Mitigado: Trivy semanal + Rebuild automático semanal |
| **DDoS volumétrico** | Baja | Alto | Mitigado: Cloud Armor Adaptive Protection + Cloud Load Balancer |
| **Fuga de datos PII** | Baja | Crítico | Mitigado: Envelope Encryption + CMEK + Clasificación datos |
| **Compromiso de SA Cloud Run** | Baja | Alto | Mitigado: Least privilege + Workload Identity + Rotación claves |
| **Config drift (Terraform vs Real)** | Media | Medio | Mitigado: `terraform plan` en CI/CD + `terraform apply` solo via CD |
| **Falta de parches en imagen base** | Media | Alto | Mitigado: Rebuild semanal automático + Trivy semanal |

### 8.3 Mejoras Futuras (Roadmap)

| Mejora | Prioridad | Esfuerzo |
|---|---|---|
| **Binary Authorization** | Alta | Media - Requiere attestors y policy |
| **VPC Service Controls** | Alta | Media - Perímetro de seguridad para datos |
| **Confidential Computing (Confidential VMs/GKE)** | Media | Alta - Requiere migración a GKE Confidential |
| **CSPM (Cloud Security Posture Management)** | Media | Baja - Security Command Center Premium |
| **Chaos Engineering (Litmus/Gremlin)** | Baja | Media - Experimentos controlados |
| **Zero Trust Network Access (BeyondCorp)** | Media | Alta - Migración progresiva |
| **SIEM/SOAR Integration (Chronicle/Splunk)** | Media | Alta - Integración logs de seguridad |
| **Automated Penetration Testing (Cobalt.io/Pentera)** | Baja | Alta - Programación trimestral |

---

## 9. Checklist de Cumplimiento Unidad 3

### Parte A: Arquitectura de Red e Identidad (20%)
- [x] VPC Custom con subredes pública/privada
- [x] Cloud NAT para egress privado
- [x] Cloud Load Balancer + Cloud Armor
- [x] Firewall rules default-deny + allow específicas
- [x] Service Accounts con least privilege
- [x] Workload Identity para Cloud Run
- [x] Cloud Billing Budget con alertas
- [x] Labels en todos los recursos

### Parte B: Hardening (25%)
- [x] Contenedores non-root
- [x] Read-only root filesystem
- [x] Capabilities drop ALL
- [x] No privilege escalation
- [x] CPU/Memory limits
- [x] Imágenes base distroless/alpine
- [x] Trivy/Grype en CI/CD (antes/después)
- [x] Lynis hardening audit (semanal)
- [x] Gitleaks en CI/CD
- [x] Container Structure Tests

### Parte C: Criptografía (25%)
- [x] Cloud Load Balancer + Google-managed SSL
- [x] SSL Policy MODERN (TLS 1.2/1.3)
- [x] Secret Manager con rotación automática
- [x] CMEK con Cloud KMS (Cloud SQL, Cloud Storage, Secret Manager)
- [x] Gitleaks en CI/CD (historial completo)
- [x] Cifrado campo sensible (Argon2id)
- [x] Mapa criptográfico documentado
- [x] Inventario datos sensibles

### Parte D: Firewall/Perimetral (20%)
- [x] VPC Firewall default-deny
- [x] Reglas allow por tags
- [x] Cloud Armor WAF (OWASP + Rate limiting)
- [x] Cloud NAT para egress
- [x] nmap externo (antes/después)
- [x] nmap interno (antes/después)

### Parte E: Documentación (10%)
- [x] docs/seguridad-u3.md completo
- [x] Evidencia organizada antes/después
- [x] Scripts reproducibles
- [x] Modelo responsabilidad compartida GCP
- [x] Riesgos residuales y mejoras futuras

---

## 10. Conclusiones

La implementación de la Unidad 3 en **Google Cloud Run** ha permitido desplegar la solución de las Unidades 1 y 2 bajo un esquema de seguridad robusto, cumpliendo con todos los requisitos del enunciado original adaptados a las capacidades nativas de GCP:

1. **Arquitectura Zero Trust**: VPC segmentada, default-deny, least privilege IAM, Workload Identity
2. **Hardening Defense-in-Depth**: Contenedores hardened, imágenes mínimas, auditoría continua
3. **Criptografía End-to-End**: TLS 1.3 en tránsito, CMEK en reposo, Secret Manager con rotación, envelope encryption para PII
4. **Perímetro Protegido**: Cloud Armor WAF, Cloud NAT, Firewall default-deny, evidencia nmap antes/después
5. **Observabilidad y Evidencia**: Monitoreo completo, alertas, logging centralizado, evidencia reproducible

La solución es **reproducible** (Terraform + Cloud Build), **auditable** (evidencia versionada en Git) y **escalable** (Cloud Run auto-scaling, Cloud SQL read replicas, Cloud Armor adaptive).

---

**Firma del Equipo:** _________________________  
**Fecha:** _________________________  
**Profesor:** Ricardo Pérez  
**Aprobación:** _________________________