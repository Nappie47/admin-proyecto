# Mapeo de Requisitos Unidad 3: AWS → Google Cloud Run

## Resumen Ejecutivo
Este documento mapea cada requisito del PDF original (diseñado para AWS) a su equivalente en Google Cloud Platform (GCP) usando **Cloud Run** como plataforma de contenedores serverless.

---

## Parte A: Arquitectura de Red e Identidad Segura

| Requisito AWS | Equivalente GCP | Implementación |
|---|---|---|
| **VPC propia** | **VPC Network** (modo custom) | `google_compute_network` con subredes custom |
| **Subred pública (gateway/proxy)** | **Subred pública** + **Cloud Load Balancer** | Subred con IP externa + Global External HTTP(S) LB |
| **Subred privada (backend, BD)** | **Subred privada** | Subred sin IP externa, acceso via Cloud NAT |
| **Internet Gateway** | **Internet Gateway** (implícito en LB) | Cloud Load Balancer maneja ingress |
| **NAT Gateway/Instancia** | **Cloud NAT** | `google_compute_router_nat` en router de la VPC |
| **Security Groups** | **VPC Firewall Rules** + **Cloud Armor** | Reglas de firewall por tags + WAF (Cloud Armor) |
| **IAM Users/Roles** | **IAM Service Accounts** + **Workload Identity** | Cuentas de servicio por servicio + WIF para Cloud Run |
| **Instance Profile** | **Service Account adjunto a Cloud Run** | `service_account_name` en Cloud Run service |
| **AWS Budgets** | **Cloud Billing Budgets** | `google_billing_budget` con alertas Pub/Sub |
| **Etiquetas (Tags)** | **Labels** | Labels en todos los recursos GCP |

### Arquitectura de Red GCP Propuesta

```
┌─────────────────────────────────────────────────────────────────┐
│                        VPC NETWORK (custom)                      │
│  ┌──────────────────────────┐  ┌────────────────────────────┐   │
│  │   SUBRED PÚBLICA         │  │   SUBRED PRIVADA             │   │
│  │  10.0.1.0/24             │  │  10.0.2.0/24                 │   │
│  │  - Cloud Load Balancer   │  │  - Cloud Run Services        │   │
│  │  - Cloud NAT (egress)    │  │  - Cloud SQL (PostgreSQL)    │   │
│  │  - Cloud Armor (WAF)     │  │  - Redis (Memorystore)       │   │
│  │  - Firewall: allow 443   │  │  - Firewall: deny all ingress│   │
│  └──────────────────────────┘  └────────────────────────────┘   │
│                                                                 │
│  Cloud Armor (WAF) → Cloud Load Balancer → Cloud Run            │
│  Cloud NAT → Internet (egress controlado)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Parte B: Hardening de Instancia, Servicios y Contenedores

| Requisito AWS | Equivalente GCP (Cloud Run) | Implementación |
|---|---|---|
| **Hardening SSH/Instancia** | **No aplica directamente** (Cloud Run es serverless) | Hardening a nivel de contenedor + Cloud Run security |
| **Deshabilitar root SSH** | **Contenedor non-root** | `USER 1000` en Dockerfile, `runAsNonRoot: true` |
| **Autenticación por llave** | **Workload Identity / OIDC** | Service Account + Workload Identity Federation |
| **Fail2ban** | **Cloud Armor Rate Limiting** | `cloud_armor_security_policy` con rate limiting |
| **Actualizaciones automáticas** | **Base images actualizadas + CI/CD** | Rebuild semanal automático via Cloud Build |
| **Contenedor non-root** | **Obligatorio en Cloud Run** | `runAsUser: 1000`, `runAsNonRoot: true` |
| **Capability drop** | **Container Security Context** | `capabilities: { drop: ["ALL"] }` |
| **Read-only filesystem** | **Cloud Run read-only** | `readOnlyRootFilesystem: true` (con tmpfs para /tmp) |
| **CPU/Memory limits** | **Cloud Run resource limits** | `cpu: "1000m", memory: "512Mi"` |
| **No privileged mode** | **Por defecto en Cloud Run** | No se permite privileged |
| **Lynis/CIS-CAT** | **Trivy + custom hardening checks** | Pipeline CI/CD con Trivy + script hardening check |
| **Trivy/Grype** | **Trivy/Grype en CI/CD** | Escaneo en cada build + reporte SARIF |

### Hardening Cloud Run Específico

```yaml
# Cloud Run service security config
spec:
  template:
    spec:
      serviceAccountName: cloudrun-app-sa@project.iam.gserviceaccount.com
      containers:
      - name: app
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop: ["ALL"]
        resources:
          limits:
            cpu: "1000m"
            memory: "512Mi"
        env:
        - name: TMPDIR
          value: "/tmp"
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir:
          medium: Memory
```

---

## Parte C: Criptografía, Gestión de Secretos y Protección de Datos

| Requisito AWS | Equivalente GCP | Implementación |
|---|---|---|
| **HTTPS/TLS en ALB** | **Cloud Load Balancer + Managed SSL** | Google-managed SSL certificates (auto-renew) |
| **Let's Encrypt/Certbot** | **Google-managed SSL** (recomendado) | `google_compute_managed_ssl_certificate` |
| **TLS 1.2/1.3, cipher suites** | **SSL Policy en Cloud LB** | `google_compute_ssl_policy` con profile MODERN |
| **testssl.sh** | **testssl.sh contra LB IP** | Pipeline CI/CD con testssl.sh |
| **AWS Secrets Manager** | **Secret Manager** | `google_secret_manager_secret` + versions |
| **Rotación de secretos** | **Secret Manager Rotation** | `rotation: { next_rotation_time, rotation_period }` |
| **gitleaks/trufflehog** | **gitleaks/trufflehog en CI/CD** | GitHub Actions / Cloud Build step |
| **EBS Encryption (KMS)** | **CMEK (Customer Managed Encryption Keys)** | `google_kms_crypto_key` + `google_kms_key_ring` |
| **S3 Encryption (SSE-KMS)** | **Cloud Storage CMEK** | Bucket con `default_kms_key_name` |
| **Versionado + Public Access Block** | **Cloud Storage Versioning + Uniform Bucket Level Access** | `versioning.enabled = true`, `uniform_bucket_level_access = true` |
| **Restauración desde backup** | **Cloud SQL Point-in-Time Recovery** + **Cloud Storage Object Versioning** | Restauración demo documentada |
| **Cifrado campo DB (bcrypt/Argon2)** | **Mismo a nivel app** | bcrypt/Argon2 en código + Cloud KMS para envelope encryption |
| **Mapa criptográfico** | **Mismo documento** | Tabla en `docs/seguridad-u3.md` |

### Mapa Criptográfico GCP

| Uso | Algoritmo/Mecanismo | Tipo | Generación/Almacenamiento Llave | Renovación |
|---|---|---|---|---|
| TLS/HTTPS (LB) | TLS 1.3, AES_256_GCM | Simétrica (sesión) / Asimétrica (cert) | Google-managed SSL / Let's Encrypt | Auto (90 días) |
| SSH/Workload Identity | OIDC / mTLS | Asimétrica | Google-managed / Service Account keys | Auto (rotación SA keys) |
| Secret Manager | AES-256-GCM | Simétrica | Google-managed / CMEK (Cloud KMS) | Configurable (30-90 días) |
| Cloud SQL (CMEK) | AES-256 | Simétrica | Cloud KMS CryptoKey | Rotación automática KMS |
| Cloud Storage (CMEK) | AES-256 | Simétrica | Cloud KMS CryptoKey | Rotación automática KMS |
| Contraseñas BD | Argon2id | Hash | Generado en app, almacenado hash | Re-hash en login |
| JWT/Session tokens | RS256 / HS256 | Asimétrica/Simétrica | Cloud KMS / Secret Manager | Rotación 24h-7d |
| Envelope Encryption (datos sensibles) | AES-256-GCM + KMS | Híbrida | DEK en app, KEK en Cloud KMS | Rotación KEK anual |

---

## Parte D: Firewall y Seguridad Perimetral

| Requisito AWS | Equivalente GCP | Implementación |
|---|---|---|
| **Security Groups default-deny** | **VPC Firewall Rules default-deny** | `priority: 65534`, `action: DENY`, `direction: INGRESS` |
| **Reglas mínimas necesarias** | **Firewall rules por tags** | Reglas `allow` específicas (priority 1000) |
| **Host firewall (UFW/iptables)** | **Cloud Run: no aplica host** | Cloud Run maneja network stack; Cloud Armor para WAF |
| **DOCKER-USER chain** | **No aplica** | Cloud Run no expone Docker socket |
| **Network ACLs** | **Hierarchical Firewall Policies** | `google_compute_firewall_policy` a nivel org/folder |
| **Cloud Armor (WAF)** | **Cloud Armor** | `google_compute_security_policy` con reglas OWASP |
| **Cloud NAT (egress control)** | **Cloud NAT** | `google_compute_router_nat` con `nat_ip_allocate_option: AUTO_ONLY` |
| **nmap escaneo externo** | **nmap contra LB IP** | `nmap -sS -p 443 <lb-ip>` desde internet |
| **nmap escaneo interno** | **nmap desde VM en VPC** | `nmap -sS <cloud-run-internal-ip>` desde bastion/VM |

### Reglas de Firewall GCP

```hcl
# Default deny ingress (priority 65534 - lowest)
resource "google_compute_firewall" "default_deny_ingress" {
  name    = "default-deny-ingress"
  network = google_compute_network.vpc.name
  priority = 65534
  direction = "INGRESS"
  deny {
    protocol = "all"
  }
}

# Allow HTTPS from Cloud Load Balancer (health checks + traffic)
resource "google_compute_firewall" "allow_lb_https" {
  name    = "allow-lb-https"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["443"]
  }
  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"] # Google health checks + LB
  target_tags   = ["cloud-run"]
}

# Allow Cloud SQL proxy / private service connect
resource "google_compute_firewall" "allow_private_services" {
  name    = "allow-private-services"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["5432", "6379"]
  }
  source_tags = ["cloud-run"]
  target_tags = ["cloud-sql", "redis"]
}
```

---

## Parte E: Validación, Evidencia y Documentación

| Requisito | Implementación GCP |
|---|---|
| **Evidencia antes/después** | Carpeta `docs/evidencia/antes/` y `docs/evidencia/despues/` con: outputs Terraform, Trivy reports, nmap scans, testssl.sh, firewall rules, IAM policies |
| **Reproducibilidad** | Todo en Git: Terraform, Dockerfiles, Cloud Build triggers, scripts de auditoría |
| **Modelo responsabilidad compartida GCP** | Documentar: GCP protege infra física, red, hipervisor; Equipo protege: contenedor, app, datos, IAM, configuración |
| **Riesgos residuales** | Documentar: Cloud Run shared tenancy, dependencia de Google-managed keys, límites de Cloud Armor WAF |

---

## Estructura del Repositorio Propuesta

```
project-root/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── cloud-run/
│   │   ├── cloud-sql/
│   │   ├── secret-manager/
│   │   ├── cloud-kms/
│   │   ├── cloud-armor/
│   │   ├── cloud-nat/
│   │   ├── load-balancer/
│   │   └── iam/
│   └── environments/
│       ├── dev/
│       └── prod/
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   ├── Dockerfile.ai
│   └── docker-compose.yml (solo para desarrollo local)
├── cloudbuild/
│   ├── cloudbuild.yaml (CI/CD pipeline)
│   ├── cloudbuild-audit.yaml (auditoría Trivy/Lynis)
│   └── cloudbuild-deploy.yaml (deploy Cloud Run)
├── scripts/
│   ├── hardening-check.sh (checks de hardening contenedor)
│   ├── nmap-scan.sh (escaneos antes/después)
│   ├── testssl-check.sh (verificación TLS)
│   ├── gitleaks-scan.sh (detección secretos)
│   └── restore-test.sh (prueba restauración backup)
├── docs/
│   ├── seguridad-u3.md (documentación principal)
│   ├── arquitectura-gcp.drawio (diagrama arquitectura)
│   ├── mapa-criptografico.csv
│   ├── evidencia/
│   │   ├── antes/
│   │   └── despues/
│   └── checklist-unidad3.md
└── .github/
    └── workflows/
        ├── ci.yaml
        ├── security-audit.yaml
        └── deploy.yaml
```

---

## Checklist de Adaptación Completa

### Parte A: Red e Identidad ☑
- [ ] VPC custom con subredes pública/privada
- [ ] Cloud NAT para egress privado
- [ ] Cloud Load Balancer + Cloud Armor
- [ ] Firewall rules default-deny + allow específicas
- [ ] Service Accounts con least privilege
- [ ] Workload Identity para Cloud Run
- [ ] Cloud Billing Budget con alertas
- [ ] Labels en todos los recursos

### Parte B: Hardening ☑
- [ ] Contenedores non-root (USER 1000)
- [ ] Read-only root filesystem
- [ ] Capabilities drop ALL
- [ ] No privilege escalation
- [ ] CPU/Memory limits
- [ ] Imágenes base distroless/alpine
- [ ] Trivy/Grype en CI/CD (antes/después)
- [ ] Hardening checks script (antes/después)

### Parte C: Criptografía ☑
- [ ] Cloud Load Balancer + Google-managed SSL
- [ ] SSL Policy MODERN (TLS 1.2/1.3)
- [ ] Secret Manager con rotación automática
- [ ] CMEK con Cloud KMS (Cloud SQL, Cloud Storage)
- [ ] gitleaks/trufflehog en CI/CD
- [ ] Cifrado campo sensible (Argon2id)
- [ ] Mapa criptográfico documentado
- [ ] Inventario datos sensibles

### Parte D: Firewall/Perimetral ☑
- [ ] VPC Firewall default-deny
- [ ] Reglas allow por tags (LB health checks, Cloud SQL, Redis)
- [ ] Cloud Armor WAF (OWASP Top 10, rate limiting)
- [ ] Cloud NAT para egress controlado
- [ ] nmap externo (antes/después)
- [ ] nmap interno (antes/después)

### Parte E: Documentación ☑
- [ ] docs/seguridad-u3.md completo
- [ ] Evidencia organizada antes/después
- [ ] Scripts reproducibles
- [ ] Modelo responsabilidad compartida GCP
- [ ] Riesgos residuales y mejoras futuras

---

## Comandos Útiles para Evidencia

```bash
# Terraform outputs
terraform output -json > docs/evidencia/despues/terraform-outputs.json

# Firewall rules
gcloud compute firewall-rules list --format=json > docs/evidencia/despues/firewall-rules.json

# IAM policies
gcloud projects get-iam-policy PROJECT_ID --format=json > docs/evidencia/despues/iam-policy.json

# Cloud Run service config
gcloud run services describe SERVICE --region=REGION --format=json > docs/evidencia/despues/cloudrun-config.json

# Cloud Armor policy
gcloud compute security-policies describe POLICY_NAME --format=json > docs/evidencia/despues/cloud-armor-policy.json

# Secret Manager secrets
gcloud secrets list --format=json > docs/evidencia/despues/secrets.json

# KMS keys
gcloud kms keys list --keyring=KEYRING --location=global --format=json > docs/evidencia/despues/kms-keys.json

# Cloud SQL config
gcloud sql instances describe INSTANCE --format=json > docs/evidencia/despues/cloudsql-config.json

# nmap escaneo externo
nmap -sS -p 443 <LB_IP> -oX docs/evidencia/despues/nmap-external.xml

# nmap escaneo interno (desde VM en VPC)
nmap -sS <CLOUD_RUN_INTERNAL_IP> -oX docs/evidencia/despues/nmap-internal.xml

# testssl.sh
testssl.sh --jsonfile docs/evidencia/despues/testssl.json <LB_DOMAIN>

# Trivy scan
trivy image --format json --output docs/evidencia/despues/trivy-report.json <IMAGE>

# gitleaks
gitleaks detect --source . --report-format json --report-path docs/evidencia/despues/gitleaks-report.json
```

---

## Costos Estimados (GCP Free Tier / Bajo Costo)

| Servicio | Costo Estimado/Mes | Notas |
|---|---|---|
| Cloud Run | $0 - $5 | Free tier: 2M requests, 360k vCPU-sec, 180k GiB-sec |
| Cloud Load Balancer | ~$18 | Global forwarding rule + data processing |
| Cloud Armor | $0 - $10 | WAF rules + 1M requests included |
| Cloud NAT | ~$10 | Por NAT gateway + data processed |
| Cloud SQL (db-f1-micro) | ~$7 | Shared core, 0.6 GB RAM |
| Cloud Storage | $0 - $1 | Primer 5 GB gratis |
| Secret Manager | $0 - $1 | 6 secret versions/mes gratis |
| Cloud KMS | $0 - $1 | Primeras 10k operaciones gratis |
| Cloud Build | $0 - $5 | 120 build-min/día gratis |
| **Total estimado** | **~$50-60** | Muy por debajo de AWS equivalente |

---

## Referencias GCP Oficiales

- [Cloud Run Security](https://cloud.google.com/run/docs/securing)
- [VPC Firewall Rules](https://cloud.google.com/vpc/docs/firewalls)
- [Cloud Armor](https://cloud.google.com/armor/docs)
- [Cloud NAT](https://cloud.google.com/nat/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud KMS](https://cloud.google.com/kms/docs)
- [Workload Identity](https://cloud.google.com/iam/docs/workload-identity-federation)
- [CMEK for Cloud SQL](https://cloud.google.com/sql/docs/postgres/cmek)
- [CMEK for Cloud Storage](https://cloud.google.com/storage/docs/encryption/customer-managed-keys)
- [Google-managed SSL Certificates](https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs)
- [SSL Policies](https://cloud.google.com/load-balancing/docs/ssl-policies)
- [Cloud Billing Budgets](https://cloud.google.com/billing/docs/how-to/budgets)
- [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview)
- [Binary Authorization](https://cloud.google.com/binary-authorization/docs/overview)
- [Container Analysis](https://cloud.google.com/container-analysis/docs/overview)

---

*Documento generado para la adaptación de la Unidad 3 de Administración de Redes a Google Cloud Run. Basado en el PDF original "Proyecto Unidad 3 - Administración 2026".*