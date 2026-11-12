# Artifact Registry Module for Unidad 3
# Repositorio Docker con vulnerability scanning y cleanup policies

# ============================================================
# ARTIFACT REGISTRY REPOSITORY
# ============================================================
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.repository_name
  description   = "Docker repository for ${var.project_name} container images"
  format        = var.format
  mode          = "STANDARD_REPOSITORY"

  # Cleanup policies
  cleanup_policies {
    id = "delete-old-untagged"
    action = "DELETE"
    most_recent_versions {
      keep_count = 10
    }
    condition {
      tag_state = "UNTAGGED"
      older_than = "30d"
    }
  }

  cleanup_policies {
    id = "delete-old-tagged"
    action = "DELETE"
    most_recent_versions {
      keep_count = 5
    }
    condition {
      tag_state = "TAGGED"
      older_than = "90d"
      version_name_prefixes = ["dev-", "feature-", "hotfix-"]
    }
  }

  # Vulnerability scanning
  dynamic "vulnerability_scanning_config" {
    for_each = var.enable_vulnerability_scanning ? [1] : []
    content {
      enablement = "ENABLED"
    }
  }

  labels = var.labels
}

# ============================================================
# IAM BINDINGS
# ============================================================
resource "google_artifact_registry_repository_iam_binding" "reader" {
  repository = google_artifact_registry_repository.repo.name
  role       = "roles/artifactregistry.reader"
  members    = var.reader_members
}

resource "google_artifact_registry_repository_iam_binding" "writer" {
  repository = google_artifact_registry_repository.repo.name
  role       = "roles/artifactregistry.writer"
  members    = var.writer_members
}

resource "google_artifact_registry_repository_iam_binding" "admin" {
  repository = google_artifact_registry_repository.repo.name
  role       = "roles/artifactregistry.admin"
  members    = var.admin_members
}

# ============================================================
# DOCKER CONFIG (para auth local)
# ============================================================
resource "local_file" "docker_config" {
  filename = "${path.module}/docker-config.json"
  content = jsonencode({
    auths = {
      "${var.region}-docker.pkg.dev" = {
        auth = ""
      }
    }
    credHelpers = {
      "${var.region}-docker.pkg.dev" = "gcloud"
    }
  })
}

# ============================================================
# OUTPUTS
# ============================================================
output "repository_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_name}"
}

output "repository_name" {
  value = google_artifact_registry_repository.repo.name
}

output "repository_id" {
  value = google_artifact_registry_repository.repo.repository_id
}