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

variable "service_account_email" {
  description = "Service account email for Cloud Build"
  type        = string
}

variable "vpc_network" {
  description = "VPC Network for private pool"
  type        = string
  default     = ""
}

variable "use_private_pool" {
  description = "Use private worker pool"
  type        = bool
  default     = false
}

variable "cloud_build_roles" {
  description = "Roles for Cloud Build service account"
  type        = list(string)
  default = [
    "roles/run.admin",
    "roles/artifactregistry.writer",
    "roles/secretmanager.secretAccessor",
    "roles/cloudsql.client",
    "roles/iam.serviceAccountUser",
    "roles/cloudbuild.builds.builder"
  ]
}

variable "default_substitutions" {
  description = "Default substitutions for all triggers"
  type        = map(string)
  default     = {}
}

variable "triggers" {
  description = "Map of Cloud Build triggers"
  type = map(object({
    name           = optional(string)
    description    = optional(string)
    build_config   = optional(string)
    github         = optional(object({
      owner         = string
      name          = string
      push          = optional(object({
        branch = string
        tag    = string
      }))
      pull_request  = optional(object({
        branch         = string
        comment_control = string
      }))
    }))
    substitutions  = optional(map(string))
    included_files = optional(list(string))
    ignored_files  = optional(list(string))
  }))
  default = {}
}

variable "services" {
  description = "Map of Cloud Run services"
  type = map(object({
    image = string
  }))
  default = {}
}

variable "artifact_registry" {
  description = "Artifact Registry repository URL"
  type        = string
}

variable "enable_security_scan" {
  description = "Enable security scanning in main build"
  type        = bool
  default     = true
}

variable "enable_trivy" {
  description = "Enable Trivy scanning in audit build"
  type        = bool
  default     = true
}

variable "enable_lynis" {
  description = "Enable Lynis hardening check in audit build"
  type        = bool
  default     = true
}

variable "enable_gitleaks" {
  description = "Enable gitleaks in audit build"
  type        = bool
  default     = true
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}