# Monitoring Module for Unidad 3
# Cloud Monitoring, Logging, Alerting, Uptime Checks

# ============================================================
# NOTIFICATION CHANNELS
# ============================================================
resource "google_monitoring_notification_channel" "email" {
  count = var.enable_email_notifications ? 1 : 0

  display_name = "Email Notifications"
  type         = "email"
  labels = {
    email_address = var.notification_email
  }
}

resource "google_monitoring_notification_channel" "slack" {
  count = var.enable_slack_notifications ? 1 : 0

  display_name = "Slack Notifications"
  type         = "slack"
  labels = {
    channel_name = var.slack_channel
    auth_token   = var.slack_token
  }
}

# ============================================================
# ALERTING POLICIES
# ============================================================

# Cloud Run - High CPU Usage
resource "google_monitoring_alert_policy" "cloud_run_high_cpu" {
  display_name = "Cloud Run High CPU Usage"
  combiner     = "OR"
  conditions {
    display_name = "CPU usage > 80%"
    condition_threshold {
      filter         = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/cpu/utilizations\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.8
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.service_name", "resource.label.location"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  alert_strategy {
    auto_close = "1800s"
  }
  labels = var.labels
}

# Cloud Run - High Memory Usage
resource "google_monitoring_alert_policy" "cloud_run_high_memory" {
  display_name = "Cloud Run High Memory Usage"
  combiner     = "OR"
  conditions {
    display_name = "Memory usage > 85%"
    condition_threshold {
      filter         = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.85
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.service_name", "resource.label.location"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Cloud Run - High Error Rate
resource "google_monitoring_alert_policy" "cloud_run_high_errors" {
  display_name = "Cloud Run High Error Rate (5xx)"
  combiner     = "OR"
  conditions {
    display_name = "Error rate > 5%"
    condition_threshold {
      filter         = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.05
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.service_name", "resource.label.location"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Cloud Run - High Latency
resource "google_monitoring_alert_policy" "cloud_run_high_latency" {
  display_name = "Cloud Run High Latency (p95 > 2s)"
  combiner     = "OR"
  conditions {
    display_name = "Latency p95 > 2 seconds"
    condition_threshold {
      filter         = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 2
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.service_name", "resource.label.location"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Cloud SQL - High CPU
resource "google_monitoring_alert_policy" "cloudsql_high_cpu" {
  display_name = "Cloud SQL High CPU Usage"
  combiner     = "OR"
  conditions {
    display_name = "Cloud SQL CPU > 80%"
    condition_threshold {
      filter         = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.8
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.database_id"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Cloud SQL - Storage Usage
resource "google_monitoring_alert_policy" "cloudsql_storage" {
  display_name = "Cloud SQL Storage Usage > 85%"
  combiner     = "OR"
  conditions {
    display_name = "Storage usage > 85%"
    condition_threshold {
      filter         = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/disk/bytes_used\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.85
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.database_id"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Cloud SQL - Connection Count
resource "google_monitoring_alert_policy" "cloudsql_connections" {
  display_name = "Cloud SQL High Connection Count"
  combiner     = "OR"
  conditions {
    display_name = "Connections > 80% of max"
    condition_threshold {
      filter         = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/connections/current\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 80
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.database_id"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Load Balancer - High Latency
resource "google_monitoring_alert_policy" "lb_high_latency" {
  display_name = "Load Balancer High Latency"
  combiner     = "OR"
  conditions {
    display_name = "LB Latency p95 > 3s"
    condition_threshold {
      filter         = "resource.type=\"https_lb_rule\" AND metric.type=\"loadbalancing.googleapis.com/https/request_latencies\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 3
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.forwarding_rule_name"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Load Balancer - High Error Rate
resource "google_monitoring_alert_policy" "lb_high_errors" {
  display_name = "Load Balancer High Error Rate"
  combiner     = "OR"
  conditions {
    display_name = "LB 5xx Error Rate > 1%"
    condition_threshold {
      filter         = "resource.type=\"https_lb_rule\" AND metric.type=\"loadbalancing.googleapis.com/https/request_count\" AND metric.labels.response_code_class=\"5xx\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.01
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.forwarding_rule_name"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Cloud Armor - Blocked Requests Spike
resource "google_monitoring_alert_policy" "cloud_armor_blocks" {
  display_name = "Cloud Armor Blocked Requests Spike"
  combiner     = "OR"
  conditions {
    display_name = "Blocked requests spike"
    condition_threshold {
      filter         = "resource.type=\"cloud_armor_security_policy\" AND metric.type=\"cloudarmor.googleapis.com/policy/blocked_request_count\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 100
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.security_policy_name"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# Billing Budget Alert
resource "google_monitoring_alert_policy" "billing_budget" {
  display_name = "Billing Budget Alert"
  combiner     = "OR"
  conditions {
    display_name = "Budget > 80%"
    condition_threshold {
      filter         = "resource.type=\"billing_account\" AND metric.type=\"billing.googleapis.com/estimated_charges\""
      duration       = "3600s"
      comparison     = "COMPARISON_GT"
      threshold_value = var.billing_budget_amount * 0.8
      aggregations {
        alignment_period     = "3600s"
        per_series_aligner   = "ALIGN_MAX"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.billing_account_id"]
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email[0].id]
  labels = var.labels
}

# ============================================================
# UPTIME CHECKS
# ============================================================
resource "google_monitoring_uptime_check_config" "api" {
  count = var.enable_uptime_checks ? 1 : 0

  display_name = "API Uptime Check"
  timeout       = "10s"
  period        = "60s"

  http_check {
    path        = "/health"
    port        = 443
    use_ssl     = true
    validate_ssl = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = var.api_domain
    }
  }

  labels = var.labels
}

resource "google_monitoring_uptime_check_config" "frontend" {
  count = var.enable_uptime_checks ? 1 : 0

  display_name = "Frontend Uptime Check"
  timeout       = "10s"
  period        = "60s"

  http_check {
    path        = "/health"
    port        = 443
    use_ssl     = true
    validate_ssl = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = var.frontend_domain
    }
  }

  labels = var.labels
}

# ============================================================
# DASHBOARDS
# ============================================================
resource "google_monitoring_dashboard" "overview" {
  dashboard_json = templatefile("${path.module}/templates/dashboard-overview.json.tmpl", {
    project_id = var.project_id
    region     = var.region
    services   = var.services
  })
}

# ============================================================
# LOG-BASED METRICS
# ============================================================
resource "google_logging_metric" "error_count" {
  name   = "error_count"
  filter = "severity>=ERROR AND resource.type=\"cloud_run_revision\""
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }
  labels = var.labels
}

resource "google_logging_metric" "latency" {
  name   = "request_latency"
  filter = "resource.type=\"cloud_run_revision\""
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "DISTRIBUTION"
  }
  labels = var.labels
}

# ============================================================
# LOG SINKS (para retención y análisis)
# ============================================================
resource "google_logging_project_sink" "security_logs" {
  name        = "security-logs-sink"
  destination = "storage.googleapis.com/${var.project_id}-security-logs"
  filter      = "severity>=WARNING AND (resource.type=\"cloud_run_revision\" OR resource.type=\"cloudsql_database\" OR resource.type=\"https_lb_rule\")"
  unique_writer_identity = true
}

resource "google_logging_project_sink" "audit_logs" {
  name        = "audit-logs-sink"
  destination = "storage.googleapis.com/${var.project_id}-audit-logs"
  filter      = "logName:cloudaudit.googleapis.com"
  unique_writer_identity = true
}

# ============================================================
# OUTPUTS
# ============================================================
output "alert_policies" {
  value = {
    cloud_run_high_cpu      = google_monitoring_alert_policy.cloud_run_high_cpu.id
    cloud_run_high_memory   = google_monitoring_alert_policy.cloud_run_high_memory.id
    cloud_run_high_errors   = google_monitoring_alert_policy.cloud_run_high_errors.id
    cloud_run_high_latency  = google_monitoring_alert_policy.cloud_run_high_latency.id
    cloudsql_high_cpu       = google_monitoring_alert_policy.cloudsql_high_cpu.id
    cloudsql_storage        = google_monitoring_alert_policy.cloudsql_storage.id
    cloudsql_connections    = google_monitoring_alert_policy.cloudsql_connections.id
    lb_high_latency         = google_monitoring_alert_policy.lb_high_latency.id
    lb_high_errors          = google_monitoring_alert_policy.lb_high_errors.id
    cloud_armor_blocks      = google_monitoring_alert_policy.cloud_armor_blocks.id
    billing_budget          = google_monitoring_alert_policy.billing_budget.id
  }
}

output "uptime_checks" {
  value = {
    api      = google_monitoring_uptime_check_config.api[0].id
    frontend = google_monitoring_uptime_check_config.frontend[0].id
  }
}