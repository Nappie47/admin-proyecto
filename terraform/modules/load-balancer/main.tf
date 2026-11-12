# Load Balancer Module for Unidad 3
# Global External HTTP(S) Load Balancer con Google-managed SSL, SSL Policy, Cloud Armor

# ============================================================
# SSL CERTIFICATES (Google-managed)
# ============================================================
resource "google_compute_managed_ssl_certificate" "certs" {
  for_each = toset(var.domains)

  name = "${var.project_name}-ssl-${each.key}-${var.suffix}"

  managed {
    domains = [each.key]
  }

  labels = var.labels
}

# ============================================================
# SSL POLICY (MODERN - TLS 1.2 + 1.3 only)
# ============================================================
resource "google_compute_ssl_policy" "policy" {
  name        = "${var.project_name}-ssl-policy-${var.suffix}"
  profile     = var.ssl_policy_profile
  min_tls_version = "TLS_1_2"

  # Custom features para MODERN profile
  custom_features = var.ssl_policy_profile == "CUSTOM" ? var.custom_ssl_features : []

  labels = var.labels
}

# ============================================================
# GLOBAL FORWARDING RULES (HTTP + HTTPS)
# ============================================================
resource "google_compute_global_address" "lb_ipv4" {
  name          = "${var.project_name}-lb-ipv4-${var.suffix}"
  purpose       = "LOAD_BALANCING"
  address_type  = "EXTERNAL"
  network_tier  = "PREMIUM"
  ip_version    = "IPV4"

  labels = var.labels
}

resource "google_compute_global_address" "lb_ipv6" {
  name          = "${var.project_name}-lb-ipv6-${var.suffix}"
  purpose       = "LOAD_BALANCING"
  address_type  = "EXTERNAL"
  network_tier  = "PREMIUM"
  ip_version    = "IPV6"

  labels = var.labels
}

# HTTP Forwarding Rule (redirect to HTTPS)
resource "google_compute_global_forwarding_rule" "http" {
  name       = "${var.project_name}-lb-http-${var.suffix}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                    = google_compute_target_http_proxy.http.id
  ip_address                = google_compute_global_address.lb_ipv4.id
  ip_version                = "IPV4"
  port_range                = "80"
  network_tier              = "PREMIUM"
  labels = var.labels
}

resource "google_compute_global_forwarding_rule" "https" {
  name       = "${var.project_name}-lb-https-${var.suffix}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                    = google_compute_target_https_proxy.https.id
  ip_address                = google_compute_global_address.lb_ipv4.id
  ip_version                = "IPV4"
  port_range                = "443"
  network_tier              = "PREMIUM"
  labels = var.labels
}

# IPv6 Forwarding Rules
resource "google_compute_global_forwarding_rule" "http_ipv6" {
  name       = "${var.project_name}-lb-http-ipv6-${var.suffix}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                    = google_compute_target_http_proxy.http.id
  ip_address                = google_compute_global_address.lb_ipv6.id
  ip_version                = "IPV6"
  port_range                = "80"
  network_tier              = "PREMIUM"
  labels = var.labels
}

resource "google_compute_global_forwarding_rule" "https_ipv6" {
  name       = "${var.project_name}-lb-https-ipv6-${var.suffix}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                    = google_compute_target_https_proxy.https.id
  ip_address                = google_compute_global_address.lb_ipv6.id
  ip_version                = "IPV6"
  port_range                = "443"
  network_tier              = "PREMIUM"
  labels = var.labels
}

# ============================================================
# TARGET PROXIES
# ============================================================
resource "google_compute_target_http_proxy" "http" {
  name        = "${var.project_name}-target-http-proxy-${var.suffix}"
  url_map     = google_compute_url_map.url_map.id
  labels = var.labels
}

resource "google_compute_target_https_proxy" "https" {
  name        = "${var.project_name}-target-https-proxy-${var.suffix}"
  url_map     = google_compute_url_map.url_map.id
  ssl_certificates = [for cert in google_compute_managed_ssl_certificate.certs : cert.id]
  ssl_policy    = google_compute_ssl_policy.policy.id
  labels = var.labels
}

# ============================================================
# URL MAP (Routing)
# ============================================================
resource "google_compute_url_map" "url_map" {
  name            = "${var.project_name}-url-map-${var.suffix}"
  default_service = google_compute_backend_bucket.default_bucket.id
  host_rules {
    hosts        = var.domains
    path_matcher = "path-matcher-1"
  }
  path_matchers {
    name            = "path-matcher-1"
    default_service = google_compute_backend_bucket.default_bucket.id
    path_rules {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }
    path_rules {
      paths   = ["/*"]
      service = google_compute_backend_service.frontend.id
    }
  }
  labels = var.labels
}

# ============================================================
# BACKEND SERVICES (Cloud Run)
# ============================================================
resource "google_compute_backend_service" "api" {
  name                  = "${var.project_name}-api-backend-${var.suffix}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP2"
  timeout_sec           = 300

  backend {
    group = google_compute_region_network_endpoint_group.api.id
  }

  health_checks = [google_compute_health_check.api.id]
  log_config {
    enable = true
    sample_rate = 1.0
  }
  security_policy = var.security_policy

  # Cloud CDN
  enable_cdn = true
  cdn_policy {
    cache_key_policy {
      include_protocol = true
      include_host = true
      include_query_string = true
    }
    signed_url_cache_max_age_sec = 3600
  }

  compression_mode = "AUTOMATIC"
  labels = var.labels
}

resource "google_compute_backend_service" "frontend" {
  name                  = "${var.project_name}-frontend-backend-${var.suffix}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP2"
  timeout_sec           = 300

  backend {
    group = google_compute_region_network_endpoint_group.frontend.id
  }

  health_checks = [google_compute_health_check.frontend.id]
  log_config {
    enable = true
    sample_rate = 1.0
  }
  security_policy = var.security_policy

  enable_cdn = true
  cdn_policy {
    cache_key_policy {
      include_protocol = true
      include_host = true
      include_query_string = true
    }
    signed_url_cache_max_age_sec = 3600
  }

  compression_mode = "AUTOMATIC"
  labels = var.labels
}

# Default backend bucket (para rutas no mapeadas)
resource "google_compute_backend_bucket" "default_bucket" {
  name = "${var.project_name}-default-bucket-${var.suffix}"
  bucket_name = "${var.project_name}-static-${var.suffix}"
  enable_cdn = true
  cdn_policy {
    cache_key_policy {
      include_protocol = true
      include_host = true
    }
    signed_url_cache_max_age_sec = 3600
  }
  labels = var.labels
}

# ============================================================
# NETWORK ENDPOINT GROUPS (Cloud Run)
# ============================================================
resource "google_compute_region_network_endpoint_group" "api" {
  name                  = "${var.project_name}-api-neg-${var.suffix}"
  region                = var.region
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = var.cloud_run_services["api"].service_name
  }
  labels = var.labels
}

resource "google_compute_region_network_endpoint_group" "frontend" {
  name                  = "${var.project_name}-frontend-neg-${var.suffix}"
  region                = var.region
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = var.cloud_run_services["frontend"].service_name
  }
  labels = var.labels
}

# ============================================================
# HEALTH CHECKS
# ============================================================
resource "google_compute_health_check" "api" {
  name                = "${var.project_name}-api-hc-${var.suffix}"
  check_interval_sec  = 30
  timeout_sec         = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3

  http_health_check {
    path        = "/health"
    port        = 8080
    request_path = "/health"
    port_specification = "USE_FIXED_PORT"
  }
  labels = var.labels
}

resource "google_compute_health_check" "frontend" {
  name                = "${var.project_name}-frontend-hc-${var.suffix}"
  check_interval_sec  = 30
  timeout_sec         = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3

  http_health_check {
    path        = "/health"
    port        = 8080
    port_specification = "USE_FIXED_PORT"
  }
  labels = var.labels
}

# ============================================================
# STORAGE BUCKET PARA STATIC ASSETS
# ============================================================
resource "google_storage_bucket" "static_assets" {
  name          = "${var.project_name}-static-${var.suffix}"
  location      = var.region
  force_destroy = true
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
      matches_storage_class = ["STANDARD"]
    }
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  labels = var.labels
}

# ============================================================
# IAM PARA BACKEND BUCKET
# ============================================================
resource "google_storage_bucket_iam_member" "cdn_access" {
  bucket = google_storage_bucket.static_assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ============================================================
# OUTPUTS
# ============================================================
output "forwarding_rule_ip" {
  value = google_compute_global_address.lb_ipv4.address
}

output "forwarding_rule_ipv6" {
  value = google_compute_global_address.lb_ipv6.address
}

output "ssl_certificate_names" {
  value = [for cert in google_compute_managed_ssl_certificate.certs : cert.name]
}

output "url_map_name" {
  value = google_compute_url_map.url_map.name
}

output "backend_service_api" {
  value = google_compute_backend_service.api.id
}

output "backend_service_frontend" {
  value = google_compute_backend_service.frontend.id
}

output "health_check_api" {
  value = google_compute_health_check.api.id
}

output "health_check_frontend" {
  value = google_compute_health_check.frontend.id
}