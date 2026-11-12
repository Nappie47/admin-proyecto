# Terraform Configuration for Unidad 3 - Google Cloud Run Security
# Arquitectura: VPC, Cloud Run, Cloud SQL, Cloud Armor, Secret Manager, KMS, IAM

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.30"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Random resources for unique names
resource "random_id" "suffix" {
  byte_length = 4
}

resource "random_password" "db_password" {
  length  = 32
  special = true
  override_special = "_%@"
}

resource "time_rotating" "secret_rotation" {
  rotation_days = 30
}

# ============================================================
# MÓDULO: VPC NETWORK
# ============================================================
module "vpc" {
  source = "./modules/vpc"

  project_id       = var.project_id
  region           = var.region
  network_name     = "${var.project_name}-vpc"
  suffix           = random_id.suffix.hex

  public_subnet_cidr  = "10.0.1.0/24"
  private_subnet_cidr = "10.0.2.0/24"

  # Cloud NAT
  enable_nat           = true
  nat_min_ports_per_vm = 64

  # Firewall
  enable_default_deny = true
  allowed_lb_ranges   = ["35.191.0.0/16", "130.211.0.0/22"]

  labels = var.common_labels
}

# ============================================================
# MÓDULO: CLOUD KMS (para CMEK)
# ============================================================
module "kms" {
  source = "./modules/kms"

  project_id = var.project_id
  region     = var.region
  key_ring_name = "${var.project_name}-keyring"
  suffix     = random_id.suffix.hex

  keys = {
    "cloudsql"  = { purpose = "ENCRYPT_DECRYPT", rotation_period = "2592000s" } # 30 días
    "storage"   = { purpose = "ENCRYPT_DECRYPT", rotation_period = "2592000s" }
    "secrets"   = { purpose = "ENCRYPT_DECRYPT", rotation_period = "7776000s" } # 90 días
  }

  labels = var.common_labels
}

# ============================================================
# MÓDULO: SECRET MANAGER
# ============================================================
module "secrets" {
  source = "./modules/secret-manager"

  project_id = var.project_id
  region     = var.region
  suffix     = random_id.suffix.hex

  kms_key_name = module.kms.keys["secrets"].id

  secrets = {
    "db-password" = {
      value     = random_password.db_password.result
      labels    = { environment = "production", type = "database" }
      rotation  = { period = "2592000s" } # 30 días
    }
    "jwt-secret" = {
      value     = random_password.db_password.result
      labels    = { environment = "production", type = "jwt" }
      rotation  = { period = "2592000s" }
    }
    "api-keys" = {
      value     = "{}"
      labels    = { environment = "production", type = "api" }
      rotation  = { period = "7776000s" }
    }
    "redis-password" = {
      value     = random_password.db_password.result
      labels    = { environment = "production", type = "redis" }
      rotation  = { period = "2592000s" }
    }
  }

  labels = var.common_labels
}

# ============================================================
# MÓDULO: CLOUD SQL (PostgreSQL)
# ============================================================
module "cloudsql" {
  source = "./modules/cloudsql"

  project_id     = var.project_id
  region         = var.region
  suffix         = random_id.suffix.hex

  network        = module.vpc.network_name
  private_subnet = module.vpc.private_subnet_name

  database_version = "POSTGRES_15"
  tier             = "db-f1-micro" # Free tier eligible

  # CMEK
  kms_key_name = module.kms.keys["cloudsql"].id

  # Configuración
  availability_type = "ZONAL"
  storage_type      = "SSD"
  storage_auto_resize = true
  storage_size_gb   = 10

  # Backups
  backup_configuration = {
    enabled            = true
    start_time         = "03:00"
    location           = var.region
    point_in_time_recovery_enabled = true
    transaction_log_retention_days = 7
  }

  # IP Config - Solo IP privada
  ip_configuration = {
    authorized_networks = []
    require_ssl         = true
    private_network     = module.vpc.network_name
  }

  # Database y usuario
  database_name = var.project_name
  user_name     = "app_user"
  user_password = random_password.db_password.result

  labels = var.common_labels
}

# ============================================================
# MÓDULO: REDIS (Memorystore)
# ============================================================
module "redis" {
  source = "./modules/redis"

  project_id = var.project_id
  region     = var.region
  suffix     = random_id.suffix.hex

  network = module.vpc.network_name

  tier           = "BASIC"
  memory_size_gb = 1
  redis_version  = "REDIS_7_0"

  # Auth
  auth_enabled = true
  auth_password = random_password.db_password.result

  labels = var.common_labels
}

# ============================================================
# MÓDULO: CLOUD ARMOR (WAF)
# ============================================================
module "cloud_armor" {
  source = "./modules/cloud-armor"

  project_id = var.project_id
  suffix     = random_id.suffix.hex

  policy_name = "${var.project_name}-armor-policy"

  # Reglas OWASP Top 10 + Rate limiting
  enable_owasp_rules = true
  enable_rate_limiting = true
  rate_limit_threshold = 1000 # requests per minute per IP

  labels = var.common_labels
}

# ============================================================
# MÓDULO: LOAD BALANCER + SSL
# ============================================================
module "load_balancer" {
  source = "./modules/load-balancer"

  project_id = var.project_id
  region     = var.region
  suffix     = random_id.suffix.hex

  # Cloud Armor
  security_policy = module.cloud_armor.security_policy_id

  # SSL Certificate (Google-managed)
  domains = var.domains

  # Backend: Cloud Run services
  cloud_run_services = {
    "api" = {
      service_name = "${var.project_name}-api"
      path_matcher = "/api/*"
    }
    "frontend" = {
      service_name = "${var.project_name}-frontend"
      path_matcher = "/*"
    }
  }

  # SSL Policy
  ssl_policy_profile = "MODERN" # TLS 1.2 + 1.3 only

  labels = var.common_labels
}

# ============================================================
# MÓDULO: CLOUD RUN SERVICES
# ============================================================
module "cloud_run" {
  source = "./modules/cloud-run"

  project_id = var.project_id
  region     = var.region
  suffix     = random_id.suffix.hex

  # VPC Connector para acceso a recursos privados
  vpc_connector = module.vpc.vpc_connector_id

  # Service Account
  service_account_email = module.iam.cloud_run_sa_email

  # Secrets
  secrets = {
    "db-password" = module.secrets.secret_versions["db-password"]
    "jwt-secret"  = module.secrets.secret_versions["jwt-secret"]
    "redis-password" = module.secrets.secret_versions["redis-password"]
  }

  # Cloud SQL
  cloudsql_instance = module.cloudsql.instance_connection_name

  # Redis
  redis_host = module.redis.host

  # Servicios
  services = {
    "api" = {
      image = "${var.artifact_registry_repo}/api:latest"
      cpu   = "1000m"
      memory = "512Mi"
      min_instances = 0
      max_instances = 10
      concurrency = 80
      env_vars = {
        "ENVIRONMENT" = "production"
        "DB_HOST" = "/cloudsql/${module.cloudsql.instance_connection_name}"
        "DB_PORT" = "5432"
        "DB_NAME" = var.project_name
        "DB_USER" = "app_user"
        "REDIS_HOST" = module.redis.host
        "REDIS_PORT" = "6379"
      }
    }
    "worker" = {
      image = "${var.artifact_registry_repo}/worker:latest"
      cpu   = "500m"
      memory = "256Mi"
      min_instances = 0
      max_instances = 5
      concurrency = 1
      env_vars = {
        "ENVIRONMENT" = "production"
        "DB_HOST" = "/cloudsql/${module.cloudsql.instance_connection_name}"
        "DB_PORT" = "5432"
        "DB_NAME" = var.project_name
        "DB_USER" = "app_user"
        "REDIS_HOST" = module.redis.host
        "REDIS_PORT" = "6379"
      }
    }
    "ai-service" = {
      image = "${var.artifact_registry_repo}/ai-service:latest"
      cpu   = "2000m"
      memory = "2Gi"
      min_instances = 0
      max_instances = 3
      concurrency = 10
      env_vars = {
        "ENVIRONMENT" = "production"
        "MODEL_PATH" = "/models"
      }
    }
  }

  # Hardening config
  run_as_non_root = true
  read_only_root_filesystem = true
  allow_privilege_escalation = false
  drop_all_capabilities = true
  cpu_limit = "1000m"
  memory_limit = "512Mi"

  labels = var.common_labels
}

# ============================================================
# MÓDULO: IAM
# ============================================================
module "iam" {
  source = "./modules/iam"

  project_id = var.project_id
  suffix     = random_id.suffix.hex

  # Service Accounts
  service_accounts = {
    "cloud-run" = {
      display_name = "Cloud Run Service Account"
      description  = "Service account for Cloud Run services"
      roles = [
        "roles/cloudsql.client",
        "roles/secretmanager.secretAccessor",
        "roles/datastore.viewer",
        "roles/logging.logWriter",
        "roles/monitoring.metricWriter",
        "roles/cloudtrace.agent"
      ]
    }
    "cloud-build" = {
      display_name = "Cloud Build Service Account"
      description  = "Service account for Cloud Build pipelines"
      roles = [
        "roles/run.admin",
        "roles/artifactregistry.writer",
        "roles/secretmanager.secretAccessor",
        "roles/cloudsql.client",
        "roles/iam.serviceAccountUser"
      ]
    }
    "terraform" = {
      display_name = "Terraform Service Account"
      description  = "Service account for Terraform deployments"
      roles = [
        "roles/owner" # En producción usar roles más específicos
      ]
    }
  }

  # Workload Identity
  workload_identity_pool = "${var.project_id}.svc.id.goog"
  workload_identity_provider = "${var.project_id}.svc.id.goog[PROVIDER]"

  labels = var.common_labels
}

# ============================================================
# MÓDULO: ARTIFACT REGISTRY
# ============================================================
module "artifact_registry" {
  source = "./modules/artifact-registry"

  project_id = var.project_id
  region     = var.region
  suffix     = random_id.suffix.hex

  repository_name = "${var.project_name}-containers"
  format         = "DOCKER"

  labels = var.common_labels
}

# ============================================================
# MÓDULO: CLOUD BUILD (CI/CD)
# ============================================================
module "cloud_build" {
  source = "./modules/cloud-build"

  project_id = var.project_id
  region     = var.region
  suffix     = random_id.suffix.hex

  service_account_email = module.iam.cloud_build_sa_email

  # Triggers
  triggers = {
    "main-branch" = {
      branch_name = "main"
      build_config = "cloudbuild/cloudbuild.yaml"
    }
    "security-audit" = {
      branch_name = "main"
      build_config = "cloudbuild/cloudbuild-audit.yaml"
    }
  }

  labels = var.common_labels
}

# ============================================================
# MÓDULO: MONITORING & LOGGING
# ============================================================
module "monitoring" {
  source = "./modules/monitoring"

  project_id = var.project_id
  region     = var.region
  suffix     = random_id.suffix.hex

  # Alerting policies
  notification_channels = ["email"] # Configurar en variables

  # Uptime checks para Cloud Run services
  uptime_checks = ["api", "frontend"]

  labels = var.common_labels
}

# ============================================================
# OUTPUTS
# ============================================================
output "vpc_network" {
  value = module.vpc.network_name
}

output "cloud_run_urls" {
  value = module.cloud_run.service_urls
}

output "load_balancer_ip" {
  value = module.load_balancer.forwarding_rule_ip
}

output "cloudsql_connection_name" {
  value = module.cloudsql.instance_connection_name
}

output "artifact_registry_repo" {
  value = module.artifact_registry.repository_url
}

output "secret_versions" {
  value = module.secrets.secret_versions
  sensitive = true
}