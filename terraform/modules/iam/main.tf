# IAM Module for Unidad 3
# Service Accounts, Roles, Workload Identity, Custom Roles

# ============================================================
# SERVICE ACCOUNTS
# ============================================================
resource "google_service_account" "accounts" {
  for_each = var.service_accounts

  account_id   = "${var.project_name}-${each.key}-${var.suffix}"
  display_name = each.value.display_name
  description  = each.value.description

  labels = merge(var.labels, { component = each.key })
}

# ============================================================
# IAM ROLES PARA SERVICE ACCOUNTS
# ============================================================
resource "google_project_iam_member" "sa_roles" {
  for_each = var.service_accounts

  project = var.project_id
  role    = each.value.roles
  member  = "serviceAccount:${google_service_account.accounts[each.key].email}"
}

# ============================================================
# CUSTOM ROLES (para least privilege)
# ============================================================
resource "google_project_iam_custom_role" "custom_roles" {
  for_each = var.custom_roles

  role_id     = "${var.project_name}_${each.key}_${var.suffix}"
  title       = each.value.title
  description = each.value.description
  permissions = each.value.permissions
  stage       = "GA"

  labels = var.labels
}

# ============================================================
# WORKLOAD IDENTITY FEDERATION
# ============================================================
resource "google_iam_workload_identity_pool" "pool" {
  workload_identity_pool_id = "${var.project_name}-pool"
  display_name              = "Workload Identity Pool for ${var.project_name}"
  description               = "Pool for workload identity federation"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "${var.project_name}-github-provider"
  display_name = "GitHub OIDC Provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
    allowed_audiences = ["sts.googleapis.com"]
    attribute_mapping = {
      "google.subject" = "assertion.sub"
      "attribute.actor" = "assertion.actor"
      "attribute.repository" = "assertion.repository"
      "attribute.ref" = "assertion.ref"
    }
  }

  attribute_condition = "assertion.repository_owner == '${var.github_owner}'"
}

# ============================================================
# WORKLOAD IDENTITY PROVIDER PARA CLOUD RUN (OIDC)
# ============================================================
resource "google_iam_workload_identity_pool_provider" "oidc" {
  workload_identity_pool_id = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "${var.project_name}-oidc-provider"
  display_name = "OIDC Provider for Cloud Run"

  oidc {
    issuer_uri = "https://accounts.google.com"
    allowed_audiences = ["https://accounts.google.com"]
  }
}

# ============================================================
# IAM POLICIES PARA WORKLOAD IDENTITY
# ============================================================
resource "google_iam_workload_identity_pool_iam_binding" "github_actions" {
  workload_identity_pool_id = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  role    = "roles/iam.workloadIdentityUser"
  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.pool.workload_identity_pool_id}/attribute.repository/${var.github_owner}/${var.github_repo}"
  ]
}

# ============================================================
# ORG POLICIES (para security)
# ============================================================
resource "google_org_policy_policy" "disable_public_ip" {
  constraint = "constraints/compute.requireOsLogin"
  boolean_policy {
    enforced = true
  }
  project = var.project_id
}

resource "google_org_policy_policy" "disable_serial_port" {
  constraint = "constraints/compute.disableSerialPortAccess"
  boolean_policy {
    enforced = true
  }
  project = var.project_id
}

resource "google_org_policy_policy" "disable_default_sa" {
  constraint = "constraints/iam.disableDefaultServiceAccountCreation"
  boolean_policy {
    enforced = true
  }
  project = var.project_id
}

resource "google_org_policy_policy" "require_os_login" {
  constraint = "constraints/compute.requireOsLogin"
  boolean_policy {
    enforced = true
  }
  project = var.project_id
}

resource "google_org_policy_policy" "restrict_public_ips" {
  constraint = "constraints/compute.vmExternalIpAccess"
  list_policy {
    deny {
      all = true
    }
  }
  project = var.project_id
}

# ============================================================
# OUTPUTS
# ============================================================
output "service_accounts" {
  value = {
    for key, sa in google_service_account.accounts :
    key => {
      email = sa.email
      name  = sa.name
    }
  }
}

output "cloud_run_sa_email" {
  value = google_service_account.accounts["cloud-run"].email
}

output "cloud_build_sa_email" {
  value = google_service_account.accounts["cloud-build"].email
}

output "terraform_sa_email" {
  value = google_service_account.accounts["terraform"].email
}

output "workload_identity_pool_id" {
  value = google_iam_workload_identity_pool.pool.workload_identity_pool_id
}

output "workload_identity_provider_github" {
  value = google_iam_workload_identity_pool_provider.github.workload_identity_pool_provider_id
}

output "workload_identity_provider_oidc" {
  value = google_iam_workload_identity_pool_provider.oidc.workload_identity_pool_provider_id
}