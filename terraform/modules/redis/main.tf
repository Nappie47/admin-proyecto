# Memorystore Redis Module for Unidad 3
# Redis con auth, TLS, Private IP

# ============================================================
# REDIS INSTANCE
# ============================================================
resource "google_redis_instance" "instance" {
  name           = "${var.project_name}-redis-${var.suffix}"
  region         = var.region
  tier           = var.tier
  memory_size_gb = var.memory_size_gb
  redis_version  = var.redis_version

  # Network
  authorized_network = var.network

  # Auth
  auth_enabled = var.auth_enabled
  auth_password = var.auth_password

  # TLS
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  # Maintenance
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
      }
      duration {
        seconds = 3600
      }
    }
  }

  # Persistence
  persistence_config {
    persistence_mode = "RDB"
    rdb_snapshot_period = "TWELVE_HOURS"
    rdb_snapshot_start_time {
      hours   = 3
      minutes = 0
    }
  }

  # Redis Config para hardening
  redis_configs = {
    "maxmemory-policy"   = "allkeys-lru"
    "timeout"            = "300"
    "tcp-keepalive"      = "60"
    "maxclients"         = "10000"
    "slowlog-log-slower-than" = "10000"
    "slowlog-max-len"    = "128"
  }

  # Maintenance window
  maintenance_schedule = [
    {
      start_day    = "SUNDAY"
      start_time   = "03:00:00"
      end_day      = "SUNDAY"
      end_time     = "06:00:00"
    }
  ]

  labels = var.labels
}

# ============================================================
# FIREWALL RULE PARA REDIS (ya está en VPC module)
# ============================================================

# ============================================================
# OUTPUTS
# ============================================================
output "instance_name" {
  value = google_redis_instance.instance.name
}

output "host" {
  value = google_redis_instance.instance.host
}

output "port" {
  value = google_redis_instance.instance.port
}

output "auth_password" {
  value = var.auth_password
  sensitive = true
}

output "instance_id" {
  value = google_redis_instance.instance.id
}