# Variables for Unidad 3 - Google Cloud Run Security

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be 6-30 lowercase letters, digits, or hyphens. Must start with a letter and end with a letter or digit."
  }
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "unidad3-admin"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,58}[a-z0-9]$", var.project_name))
    error_message = "Project name must be 3-63 lowercase letters, digits, or hyphens."
  }
}

variable "region" {
  description = "GCP Region for resources"
  type        = string
  default     = "us-central1"
  validation {
    condition     = contains(["us-central1", "us-east1", "us-west1", "europe-west1", "southamerica-east1"], var.region)
    error_message = "Region must be a supported GCP region."
  }
}

variable "domains" {
  description = "List of domains for SSL certificates and Load Balancer"
  type        = list(string)
  default     = []
}

variable "artifact_registry_repo" {
  description = "Artifact Registry repository name for container images"
  type        = string
  default     = ""
}

variable "notification_email" {
  description = "Email for billing and monitoring alerts"
  type        = string
  default     = ""
}

variable "common_labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default = {
    project     = "unidad3-admin"
    environment = "production"
    managed_by  = "terraform"
    owner       = "admin-team"
  }
}

variable "enable_vpc_connector" {
  description = "Enable Serverless VPC Access Connector for Cloud Run"
  type        = bool
  default     = true
}

variable "enable_cloud_armor" {
  description = "Enable Cloud Armor WAF"
  type        = bool
  default     = true
}

variable "enable_cloud_nat" {
  description = "Enable Cloud NAT for private subnet egress"
  type        = bool
  default     = true
}

variable "db_tier" {
  description = "Cloud SQL tier (db-f1-micro for free tier, db-g1-small for production)"
  type        = string
  default     = "db-f1-micro"
  validation {
    condition     = contains(["db-f1-micro", "db-g1-small", "db-custom-1-3840"], var.db_tier)
    error_message = "Unsupported Cloud SQL tier."
  }
}

variable "redis_tier" {
  description = "Memorystore Redis tier"
  type        = string
  default     = "BASIC"
  validation {
    condition     = contains(["BASIC", "STANDARD_HA"], var.redis_tier)
    error_message = "Unsupported Redis tier."
  }
}

variable "redis_memory_gb" {
  description = "Memorystore Redis memory in GB"
  type        = number
  default     = 1
  validation {
    condition     = var.redis_memory_gb >= 1 && var.redis_memory_gb <= 30
    error_message = "Redis memory must be between 1 and 30 GB."
  }
}

variable "cloud_run_max_instances" {
  description = "Maximum Cloud Run instances per service"
  type        = map(number)
  default = {
    api        = 10
    worker     = 5
    ai_service = 3
  }
}

variable "cloud_run_min_instances" {
  description = "Minimum Cloud Run instances per service (0 = scale to zero)"
  type        = map(number)
  default = {
    api        = 0
    worker     = 0
    ai_service = 0
  }
}

variable "cloud_run_cpu" {
  description = "CPU limits per Cloud Run service"
  type        = map(string)
  default = {
    api        = "1000m"
    worker     = "500m"
    ai_service = "2000m"
  }
}

variable "cloud_run_memory" {
  description = "Memory limits per Cloud Run service"
  type        = map(string)
  default = {
    api        = "512Mi"
    worker     = "256Mi"
    ai_service = "2Gi"
  }
}

variable "enable_binary_authorization" {
  description = "Enable Binary Authorization for container images"
  type        = bool
  default     = false
}

variable "enable_container_analysis" {
  description = "Enable Container Analysis for vulnerability scanning"
  type        = bool
  default     = true
}

variable "billing_budget_amount" {
  description = "Monthly budget amount in USD for billing alerts"
  type        = number
  default     = 100
}

variable "billing_budget_threshold" {
  description = "Budget threshold percentages for alerts"
  type        = list(number)
  default     = [50, 80, 90, 100]
}