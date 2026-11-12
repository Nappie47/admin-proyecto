# Secret Manager Module for Unidad 3
# Crea secrets con rotación automática y CMEK

# ============================================================
# SECRETS
# ============================================================
resource "google_secret_manager_secret" "secrets" {
  for_each = var.secrets

  secret_id = "${var.project_name}-${each.key}"
  replication {
    automatic = true
  }

  # CMEK encryption
  dynamic "customer_managed_encryption" {
    for_each = var.kms_key_name != "" ? [1] : []
    content {
      kms_key_name = var.kms_key_name
    }
  }

  # Rotación automática
  dynamic "rotation" {
    for_each = each.value.rotation != null ? [each.value.rotation] : []
    content {
      next_rotation_time = rotation.value.period != null ? timeadd(timestamp(), rotation.value.period) : null
      rotation_period    = rotation.value.period
    }
  }

  labels = merge(var.labels, {
    secret_name = each.key
    environment = each.value.labels.environment
    type        = each.value.labels.type
  })

  # Annotations para documentación
  annotations = {
    description = each.value.description != null ? each.value.description : "Secret for ${each.key}"
  }
}

# ============================================================
# SECRET VERSIONS (valores iniciales)
# ============================================================
resource "google_secret_manager_secret_version" "versions" {
  for_each = var.secrets

  secret = google_secret_manager_secret.secrets[each.key].id

  # Secret data - en producción usar variable sensible o external secret
  secret_data = each.value.value != "" ? base64encode(each.value.value) : base64encode("CHANGE_ME_${each.key}")

  lifecycle {
    # No recrear si cambia el valor (gestionado por rotación)
    ignore_changes = [secret_data]
  }
}

# ============================================================
# IAM BINDINGS
# ============================================================
resource "google_secret_manager_secret_iam_binding" "secret_accessor" {
  for_each = var.secrets

  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  members   = each.value.iam_members != null ? each.value.iam_members : []
}

# ============================================================
# ROTATION SCHEDULES (Cloud Scheduler para rotación custom)
# ============================================================
resource "google_cloud_scheduler_job" "secret_rotation" {
  for_each = var.secrets

  count = each.value.rotation != null && each.value.rotation.period != "" ? 1 : 0

  name        = "rotate-${var.project_name}-${each.key}"
  description = "Rotación automática de secret ${each.key}"
  schedule    = "0 3 * * 0" # Domingos a las 3 AM
  time_zone   = "America/Santiago"

  http_target {
    uri         = "https://secretmanager.googleapis.com/v1/projects/${var.project_id}/secrets/${var.project_name}-${each.key}:rotate"
    http_method = "POST"
    oauth_token {
      service_account_email = var.rotation_sa_email
    }
  }
}

# ============================================================
# OUTPUTS
# ============================================================
output "secrets" {
  value = {
    for key, secret in google_secret_manager_secret.secrets :
    key => {
      name        = secret.secret_id
      id          = secret.id
      replication = secret.replication
    }
  }
}

output "secret_versions" {
  value = {
    for key, version in google_secret_manager_secret_version.versions :
    key => {
      name = version.name
      # No incluir el valor por seguridad
    }
  }
  sensitive = true
}