# Cloud Build Module for Unidad 3
# CI/CD pipelines con security scanning, testing, y deploy

# ============================================================
# CLOUD BUILD TRIGGERS
# ============================================================
resource "google_cloudbuild_trigger" "triggers" {
  for_each = var.triggers

  name        = each.value.name != "" ? each.value.name : "trigger-${each.key}"
  description = each.value.description != "" ? each.value.description : "Trigger for ${each.key}"
  filename    = each.value.build_config != "" ? each.value.build_config : "cloudbuild/cloudbuild.yaml"

  # GitHub source
  dynamic "github" {
    for_each = each.value.github != null ? [each.value.github] : []
    content {
      owner = github.value.owner
      name  = github.value.name

      dynamic "push" {
        for_each = github.value.push != null ? [github.value.push] : []
        content {
          branch = push.value.branch
          tag    = push.value.tag
        }
      }

      dynamic "pull_request" {
        for_each = github.value.pull_request != null ? [github.value.pull_request] : []
        content {
          branch = pull_request.value.branch
          comment_control = pull_request.value.comment_control
        }
      }
    }
  }

  # Service Account
  service_account = var.service_account_email

  # Substitutions
  substitutions = merge(var.default_substitutions, each.value.substitutions != null ? each.value.substitutions : {})

  # Included files filter
  included_files = each.value.included_files != null ? each.value.included_files : ["**/*"]

  # Ignored files filter
  ignored_files = each.value.ignored_files != null ? each.value.ignored_files : []
}

# ============================================================
# CLOUD BUILD SERVICE ACCOUNT
# ============================================================
resource "google_service_account" "cloud_build" {
  account_id   = "${var.project_name}-cloudbuild-${var.suffix}"
  display_name = "Cloud Build Service Account"
  description  = "Service account for Cloud Build pipelines"
}

# ============================================================
# IAM ROLES PARA CLOUD BUILD
# ============================================================
resource "google_project_iam_member" "cloud_build_roles" {
  for_each = toset(var.cloud_build_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
}

# ============================================================
# CLOUD BUILD WORKER POOL (opcional, para builds privados)
# ============================================================
resource "google_cloudbuild_worker_pool" "private_pool" {
  count = var.use_private_pool ? 1 : 0

  name = "${var.project_name}-private-pool-${var.suffix}"

  private_pool_v1_config {
    network_config {
      egress_option = "PRIVATE_EGRESS"
      peered_network = var.vpc_network
    }
    worker_config {
      machine_type = "E2_HIGHCPU_8"
      disk_size_gb = 100
    }
  }

  labels = var.labels
}

# ============================================================
# CLOUD BUILD BUILD CONFIGS (generados como local files)
# ============================================================
resource "local_file" "cloudbuild_main" {
  filename = "${path.root}/../cloudbuild/cloudbuild.yaml"
  content = templatefile("${path.module}/templates/cloudbuild.yaml.tmpl", {
    project_id = var.project_id
    region     = var.region
    services   = var.services
    artifact_registry = var.artifact_registry
    enable_security_scan = var.enable_security_scan
  })
}

resource "local_file" "cloudbuild_audit" {
  filename = "${path.root}/../cloudbuild/cloudbuild-audit.yaml"
  content = templatefile("${path.module}/templates/cloudbuild-audit.yaml.tmpl", {
    project_id = var.project_id
    region     = var.region
    enable_trivy = var.enable_trivy
    enable_lynis = var.enable_lynis
    enable_gitleaks = var.enable_gitleaks
  })
}

resource "local_file" "cloudbuild_deploy" {
  filename = "${path.root}/../cloudbuild/cloudbuild-deploy.yaml"
  content = templatefile("${path.module}/templates/cloudbuild-deploy.yaml.tmpl", {
    project_id = var.project_id
    region     = var.region
    services   = var.services
    artifact_registry = var.artifact_registry
  })
}

# ============================================================
# OUTPUTS
# ============================================================
output "cloud_build_sa_email" {
  value = google_service_account.cloud_build.email
}

output "trigger_names" {
  value = [for key, trigger in google_cloudbuild_trigger.triggers : trigger.name]
}