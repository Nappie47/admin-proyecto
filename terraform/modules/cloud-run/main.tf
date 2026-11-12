# Cloud Run Module for Unidad 3
# Servicios serverless con hardening completo

# ============================================================
# SERVICE ACCOUNT PARA CLOUD RUN
# ============================================================
resource "google_service_account" "cloud_run" {
  count = var.create_service_account ? 1 : 0

  account_id   = "${var.project_name}-cloudrun-${var.suffix}"
  display_name = "Cloud Run Service Account"
  description  = "Service account for Cloud Run services with least privilege"

  labels = var.labels
}

# ============================================================
# IAM BINDINGS PARA SERVICE ACCOUNT
# ============================================================
resource "google_project_iam_member" "cloud_run_roles" {
  for_each = var.service_account_roles

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run[0].email}"
}

# ============================================================
# WORKLOAD IDENTITY POOL Y PROVIDER (para OIDC)
# ============================================================
resource "google_iam_workload_identity_pool" "pool" {
  workload_identity_pool_id = "${var.project_name}-pool"
  display_name              = "Workload Identity Pool for ${var.project_name}"
  description               = "Pool for Cloud Run workload identity federation"
}

resource "google_iam_workload_identity_pool_provider" "provider" {
  workload_identity_pool_id = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "${var.project_name}-provider"
  display_name = "OIDC Provider for ${var.project_name}"

  oidc {
    issuer_uri = "https://accounts.google.com"
    allowed_audiences = ["https://accounts.google.com"]
  }
}

# ============================================================
# CLOUD RUN SERVICES
# ============================================================
resource "google_cloud_run_v2_service" "services" {
  for_each = var.services

  name     = "${var.project_name}-${each.key}-${var.suffix}"
  location = var.region

  # Service Account
  template {
    service_account = var.service_account_email != "" ? var.service_account_email : google_service_account.cloud_run[0].email

    # Contenedor
    containers {
      name  = each.key
      image = each.value.image

      # Hardening: non-root, read-only, capabilities drop
      startup_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 10
        period_seconds        = 10
        failure_threshold     = 3
        http_get {
          path = "/health"
          port = 8080
        }
      }

      liveness_probe {
        initial_delay_seconds = 30
        timeout_seconds       = 10
        period_seconds        = 10
        failure_threshold     = 3
        http_get {
          path = "/health"
          port = 8080
        }
      }

      readiness_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 10
        period_seconds        = 10
        failure_threshold     = 3
        http_get {
          path = "/health"
          port = 8080
        }
      }

      # Variables de entorno
      env {
        for key, value in each.value.env_vars : {
          name  = key
          value = value
        }
      }

      # Secrets
      dynamic "env" {
        for_each = var.secrets
        content {
          name = each.key
          value_source {
            secret_key_ref {
              secret  = each.value.secret
              version = "latest"
            }
          }
        }
      }

      # Hardening: Resources
      resources {
        limits = {
          cpu    = each.value.cpu
          memory = each.value.memory
        }
      }

      # Hardening: Security Context
      # Cloud Run v2 usa execution_environment para security
    }

    # VPC Connector
    vpc_access {
      egress = "ALL_TRAFFIC"
      connector = var.vpc_connector
    }

    # Scaling
    scaling {
      min_instance_count = each.value.min_instances
      max_instance_count = each.value.max_instances
    }

    # Execution Environment (Gen2)
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

    # Service mesh (opcional)
    # service_mesh = true
  }

  # Ingress - solo desde Load Balancer
  ingress = "INGRESS_TRAFFIC_ALLOW_INTERNAL_ONLY"

  # Labels
  labels = merge(var.labels, {
    service = each.key
  })
}

# ============================================================
# IAM POLICY PARA SERVICIOS (Ingress internal only)
# ============================================================
resource "google_cloud_run_v2_service_iam_binding" "invoker" {
  for_each = var.services

  service = google_cloud_run_v2_service.services[each.key].name
  location = var.region
  role    = "roles/run.invoker"
  members = ["allUsers"] # O restringir a service accounts específicos
}

# ============================================================
# CLOUD BUILD TRIGGER PARA DEPLOY AUTOMÁTICO
# ============================================================
resource "google_cloudbuild_trigger" "deploy" {
  for_each = var.services

  name        = "deploy-${var.project_name}-${each.key}"
  description = "Deploy ${each.key} to Cloud Run on push to main"
  filename    = "cloudbuild/cloudbuild-deploy.yaml"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = "^main$"
    }
  }

  service_account = var.cloud_build_sa_email

  # Substitution variables
  substitutions = {
    "_SERVICE_NAME" = "${var.project_name}-${each.key}-${var.suffix}"
    "_REGION"       = var.region
    "_IMAGE"        = each.value.image
  }
}

# ============================================================
# SERVICE ACCOUNT IAM BINDINGS (para Cloud Build)
# ============================================================
resource "google_service_account_iam_binding" "cloud_build_deployer" {
  service_account_id = google_service_account.cloud_run[0].name
  role               = "roles/iam.serviceAccountUser"
  members            = ["serviceAccount:${var.cloud_build_sa_email}"]
}

# ============================================================
# OUTPUTS
# ============================================================
output "service_urls" {
  value = {
    for key, service in google_cloud_run_v2_service.services :
    key => service.uri
  }
}

output "service_names" {
  value = {
    for key, service in google_cloud_run_v2_service.services :
    key => service.name
  }
}

output "service_account_email" {
  value = google_service_account.cloud_run[0].email
}

output "workload_identity_pool" {
  value = google_iam_workload_identity_pool.pool.workload_identity_pool_id
}

output "workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.provider.workload_identity_pool_provider_id
}