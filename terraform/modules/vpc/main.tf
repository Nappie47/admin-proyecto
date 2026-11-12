# VPC Module for Unidad 3
# Crea VPC custom con subredes pública y privada, Cloud NAT, VPC Connector, Firewall rules

# ============================================================
# VPC NETWORK
# ============================================================
resource "google_compute_network" "vpc" {
  name                    = var.network_name
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  mtu                     = 1460

  labels = var.labels
}

# ============================================================
# SUBREDES
# ============================================================
resource "google_compute_subnetwork" "public" {
  name          = "${var.network_name}-public"
  network       = google_compute_network.vpc.id
  ip_cidr_range = var.public_subnet_cidr
  region        = var.region
  purpose       = "PRIVATE"

  # Private IP Google Access para acceso a APIs de Google sin IP pública
  private_ip_google_access = true

  labels = var.labels
}

resource "google_compute_subnetwork" "private" {
  name          = "${var.network_name}-private"
  network       = google_compute_network.vpc.id
  ip_cidr_range = var.private_subnet_cidr
  region        = var.region
  purpose       = "PRIVATE"

  # Private IP Google Access
  private_ip_google_access = true

  labels = var.labels
}

# ============================================================
# CLOUD ROUTER (para Cloud NAT)
# ============================================================
resource "google_compute_router" "router" {
  name    = "${var.network_name}-router"
  network = google_compute_network.vpc.name
  region  = var.region

  bgp {
    asn               = 64514
    advertise_mode    = "DEFAULT"
    advertise_groups  = ["ALL_SUBNETS"]
  }

  labels = var.labels
}

# ============================================================
# CLOUD NAT
# ============================================================
resource "google_compute_router_nat" "nat" {
  count = var.enable_nat ? 1 : 0

  name                               = "${var.network_name}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETS_ALL_PRIMARY_IP_RANGES"

  log_config {
    enable = true
    filter = "ALL"
  }

  # Configuración de puertos
  min_ports_per_vm = var.nat_min_ports_per_vm

  # Timeouts
  udp_idle_timeout_sec  = 30
  icmp_idle_timeout_sec = 30
  tcp_established_idle_timeout_sec = 1200
  tcp_transitory_idle_timeout_sec  = 30

  labels = var.labels
}

# ============================================================
# SERVERLESS VPC ACCESS CONNECTOR (para Cloud Run)
# ============================================================
resource "google_vpc_access_connector" "connector" {
  count = var.enable_vpc_connector ? 1 : 0

  name           = "${var.network_name}-connector"
  region         = var.region
  network        = google_compute_network.vpc.id
  subnet         = google_compute_subnetwork.private.id
  ip_cidr_range  = "10.8.0.0/28" # /28 = 16 IPs
  min_instances  = 2
  max_instances  = 10
  machine_type   = "e2-micro"

  labels = var.labels
}

# ============================================================
# FIREWALL RULES
# ============================================================

# Default Deny Ingress (Priority 65534 - lowest)
resource "google_compute_firewall" "default_deny_ingress" {
  name    = "${var.network_name}-default-deny-ingress"
  network = google_compute_network.vpc.name
  priority = 65534
  direction = "INGRESS"

  deny {
    protocol = "all"
  }

  labels = var.labels
}

# Default Deny Egress (Priority 65534)
resource "google_compute_firewall" "default_deny_egress" {
  name    = "${var.network_name}-default-deny-egress"
  network = google_compute_network.vpc.name
  priority = 65534
  direction = "EGRESS"

  deny {
    protocol = "all"
  }

  labels = var.labels
}

# Allow HTTPS from Cloud Load Balancer (Health checks + traffic)
resource "google_compute_firewall" "allow_lb_https" {
  name    = "${var.network_name}-allow-lb-https"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = var.allowed_lb_ranges
  target_tags   = ["cloud-run", "load-balancer-backend"]

  labels = var.labels
}

# Allow HTTP from Cloud Load Balancer (para redirect a HTTPS)
resource "google_compute_firewall" "allow_lb_http" {
  name    = "${var.network_name}-allow-lb-http"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = var.allowed_lb_ranges
  target_tags   = ["cloud-run", "load-balancer-backend"]

  labels = var.labels
}

# Allow Cloud SQL / Private Service Connect
resource "google_compute_firewall" "allow_private_services" {
  name    = "${var.network_name}-allow-private-services"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["5432", "3306", "6379", "11211"]
  }

  source_tags = ["cloud-run", "vpc-connector"]
  target_tags = ["cloud-sql", "redis", "private-service"]

  labels = var.labels
}

# Allow VPC Connector to reach private services
resource "google_compute_firewall" "allow_vpc_connector" {
  name    = "${var.network_name}-allow-vpc-connector"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "all"
  }

  source_tags = ["vpc-connector"]
  target_tags = ["cloud-sql", "redis", "private-service"]

  labels = var.labels
}

# Allow VPC Connector egress to private services
resource "google_compute_firewall" "allow_vpc_connector_egress" {
  name    = "${var.network_name}-allow-vpc-connector-egress"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "EGRESS"

  allow {
    protocol = "all"
  }

  source_tags = ["vpc-connector"]
  target_tags = ["cloud-sql", "redis", "private-service"]

  labels = var.labels
}

# Allow Cloud Run to Cloud SQL (via Private Service Connect / VPC Connector)
resource "google_compute_firewall" "allow_cloudrun_to_cloudsql" {
  name    = "${var.network_name}-allow-cloudrun-to-cloudsql"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["5432"]
  }

  source_tags = ["cloud-run"]
  target_tags = ["cloud-sql"]

  labels = var.labels
}

# Allow Cloud Run to Redis
resource "google_compute_firewall" "allow_cloudrun_to_redis" {
  name    = "${var.network_name}-allow-cloudrun-to-redis"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["6379"]
  }

  source_tags = ["cloud-run"]
  target_tags = ["redis"]

  labels = var.labels
}

# Allow Health Checks from Load Balancer
resource "google_compute_firewall" "allow_health_checks" {
  name    = "${var.network_name}-allow-health-checks"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22", "209.85.152.0/22", "209.85.204.0/22"]
  target_tags   = ["cloud-run", "load-balancer-backend"]

  labels = var.labels
}

# Allow SSH from specific IPs only (para bastion/debug)
resource "google_compute_firewall" "allow_ssh_bastion" {
  count = var.enable_ssh_bastion ? 1 : 0

  name    = "${var.network_name}-allow-ssh-bastion"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.bastion_ips
  target_tags   = ["bastion"]

  labels = var.labels
}

# Allow internal communication within private subnet
resource "google_compute_firewall" "allow_internal_private" {
  name    = "${var.network_name}-allow-internal-private"
  network = google_compute_network.vpc.name
  priority = 2000
  direction = "INGRESS"

  allow {
    protocol = "all"
  }

  source_ranges = [var.private_subnet_cidr]
  target_tags   = ["private-service"]

  labels = var.labels
}

# Allow egress to Google APIs (Private Google Access)
resource "google_compute_firewall" "allow_google_apis" {
  name    = "${var.network_name}-allow-google-apis"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "EGRESS"

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  destination_ranges = ["199.36.153.4/30", "199.36.153.8/30"] # Google APIs
  target_tags = ["cloud-run", "vpc-connector", "private-service"]

  labels = var.labels
}

# Allow DNS egress
resource "google_compute_firewall" "allow_dns_egress" {
  name    = "${var.network_name}-allow-dns-egress"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "EGRESS"

  allow {
    protocol = "udp"
    ports    = ["53"]
  }
  allow {
    protocol = "tcp"
    ports    = ["53"]
  }

  target_tags = ["cloud-run", "vpc-connector", "private-service"]

  labels = var.labels
}

# Allow NTP egress
resource "google_compute_firewall" "allow_ntp_egress" {
  name    = "${var.network_name}-allow-ntp-egress"
  network = google_compute_network.vpc.name
  priority = 1000
  direction = "EGRESS"

  allow {
    protocol = "udp"
    ports    = ["123"]
  }

  target_tags = ["cloud-run", "vpc-connector", "private-service"]

  labels = var.labels
}

# ============================================================
# PRIVATE SERVICE CONNECT (para Cloud SQL / Redis)
# ============================================================
resource "google_compute_global_address" "private_services_access" {
  name          = "${var.network_name}-private-services-access"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services_access.name]
}

# ============================================================
# OUTPUTS
# ============================================================
output "network_name" {
  value = google_compute_network.vpc.name
}

output "network_id" {
  value = google_compute_network.vpc.id
}

output "public_subnet_name" {
  value = google_compute_subnetwork.public.name
}

output "public_subnet_id" {
  value = google_compute_subnetwork.public.id
}

output "public_subnet_cidr" {
  value = google_compute_subnetwork.public.ip_cidr_range
}

output "private_subnet_name" {
  value = google_compute_subnetwork.private.name
}

output "private_subnet_id" {
  value = google_compute_subnetwork.private.id
}

output "private_subnet_cidr" {
  value = google_compute_subnetwork.private.ip_cidr_range
}

output "vpc_connector_id" {
  value = google_vpc_access_connector.connector[0].id
}

output "vpc_connector_name" {
  value = google_vpc_access_connector.connector[0].name
}

output "router_name" {
  value = google_compute_router.router.name
}

output "nat_name" {
  value = google_compute_router_nat.nat[0].name
}