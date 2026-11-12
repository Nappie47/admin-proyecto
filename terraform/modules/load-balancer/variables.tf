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

variable "domains" {
  description = "List of domains for SSL certificates"
  type        = list(string)
  default     = []
}

variable "cloud_run_services" {
  description = "Map of Cloud Run services for backend"
  type = map(object({
    service_name = string
    path_matcher = string
  }))
  default = {}
}

variable "security_policy" {
  description = "Cloud Armor security policy ID"
  type        = string
  default     = ""
}

variable "ssl_policy_profile" {
  description = "SSL Policy profile (MODERN, RESTRICTED, COMPATIBLE, CUSTOM)"
  type        = string
  default     = "MODERN"
}

variable "custom_ssl_features" {
  description = "Custom SSL features for CUSTOM profile"
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}