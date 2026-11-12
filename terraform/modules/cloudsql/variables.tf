variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
}

variable "suffix" {
  description = "Random suffix"
  type        = string
}

variable "network" {
  description = "VPC Network name"
  type        = string
}

variable "private_subnet" {
  description = "Private subnet name"
  type        = string
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-f1-micro"
}

variable "availability_type" {
  description = "Availability type (ZONAL, REGIONAL)"
  type        = string
  default     = "ZONAL"
}

variable "storage_type" {
  description = "Storage type (SSD, HDD)"
  type        = string
  default     = "SSD"
}

variable "storage_size_gb" {
  description = "Storage size in GB"
  type        = number
  default     = 10
}

variable "storage_auto_resize" {
  description = "Enable storage auto resize"
  type        = bool
  default     = true
}

variable "backup_configuration" {
  description = "Backup configuration"
  type = object({
    enabled                           = bool
    start_time                        = string
    location                          = string
    point_in_time_recovery_enabled    = bool
    transaction_log_retention_days    = number
  })
  default = {
    enabled                           = true
    start_time                        = "03:00"
    location                          = "us-central1"
    point_in_time_recovery_enabled    = true
    transaction_log_retention_days    = 7
  }
}

variable "ip_configuration" {
  description = "IP configuration"
  type = object({
    authorized_networks = list(string)
    require_ssl         = bool
    private_network     = string
  })
  default = {
    authorized_networks = []
    require_ssl         = true
    private_network     = ""
  }
}

variable "kms_key_name" {
  description = "KMS key name for CMEK"
  type        = string
  default     = ""
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "user_name" {
  description = "Database user name"
  type        = string
}

variable "user_password" {
  description = "Database user password"
  type        = string
}

variable "cloud_run_sa_members" {
  description = "Cloud Run service account members for Cloud SQL client role"
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}