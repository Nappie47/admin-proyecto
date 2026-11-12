# Cloud SQL Module for Unidad 3
# PostgreSQL con CMEK, Private IP, SSL obligatorio, Backups automáticos

# ============================================================
# CLOUD SQL INSTANCE
# ============================================================
resource "google_sql_database_instance" "instance" {
  name             = "${var.project_name}-db-${var.suffix}"
  region           = var.region
  database_version = var.database_version
  settings {
    tier              = var.tier
    availability_type = var.availability_type

    # Storage
    disk_type          = var.storage_type
    disk_size          = var.storage_size_gb
    disk_autoresize    = var.storage_auto_resize

    # Backups
    backup_configuration {
      enabled                        = var.backup_configuration.enabled
      start_time                     = var.backup_configuration.start_time
      location                       = var.backup_configuration.location
      point_in_time_recovery_enabled = var.backup_configuration.point_in_time_recovery_enabled
      transaction_log_retention_days = var.backup_configuration.transaction_log_retention_days
    }

    # IP Configuration - Solo Private IP
    ip_configuration {
      authorized_networks = var.ip_configuration.authorized_networks
      require_ssl         = var.ip_configuration.require_ssl
      private_network     = var.ip_configuration.private_network
    }

    # Database flags para hardening
    database_flags = [
      { name = "log_connections",         value = "on" },
      { name = "log_disconnections",      value = "on" },
      { name = "log_duration",            value = "on" },
      { name = "log_statement",           value = "all" },
      { name = "log_min_duration_statement", value = "1000" },
      { name = "password_encryption",     value = "scram-sha-256" },
      { name = "ssl_min_protocol_version", value = "TLSv1.2" },
      { name = "shared_preload_libraries", value = "pg_stat_statements" },
      { name = "track_activity_query_size", value = "4096" },
    }

    # Maintenance window
    maintenance_window {
      day  = 7  # Domingo
      hour = 3  # 3 AM
    }

    # Pricing plan
    pricing_plan = "PER_USE"

    # Backup retention
    backup_retention_settings {
      retention_unit = "COUNT"
      retained_backups = 7
    }

    # Insights
    insights_config {
      query_insights_enabled = true
      record_application_tags = true
    }
  }

  # CMEK
  dynamic "encryption_configuration" {
    for_each = var.kms_key_name != "" ? [1] : []
    content {
      kms_key_name = var.kms_key_name
    }
  }

  # Deletion protection
  deletion_protection = true

  labels = var.labels
}

# ============================================================
# DATABASE
# ============================================================
resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.instance.name
  charset  = "UTF8"
  collation = "en_US.UTF8"
}

# ============================================================
# DATABASE USER
# ============================================================
resource "google_sql_user" "user" {
  name     = var.user_name
  instance = google_sql_database_instance.instance.name
  password = var.user_password

  # Permisos mínimos
  sqlserver_user_details {
    disabled = false
  }
}

# ============================================================
# SSL CERT (para conexiones SSL)
# ============================================================
resource "google_sql_ssl_cert" "server_ca" {
  instance = google_sql_database_instance.instance.name
  common_name = "${var.project_name}-server-ca"
}

# ============================================================
# IAM BINDINGS (para Cloud Run access)
# ============================================================
resource "google_sql_database_instance_iam_binding" "cloud_run_client" {
  instance = google_sql_database_instance.instance.name
  role     = "roles/cloudsql.client"
  members  = var.cloud_run_sa_members
}

# ============================================================
# OUTPUTS
# ============================================================
output "instance_name" {
  value = google_sql_database_instance.instance.name
}

output "instance_connection_name" {
  value = google_sql_database_instance.instance.connection_name
}

output "instance_ip" {
  value = google_sql_database_instance.instance.private_ip_address
}

output "instance_public_ip" {
  value = google_sql_database_instance.instance.public_ip_address
}

output "database_name" {
  value = google_sql_database.database.name
}

output "user_name" {
  value = google_sql_user.user.name
}

output "server_ca_cert" {
  value = google_sql_ssl_cert.server_ca.cert
  sensitive = true
}

output "server_ca_cert_serial" {
  value = google_sql_ssl_cert.server_ca.cert_serial_number
}