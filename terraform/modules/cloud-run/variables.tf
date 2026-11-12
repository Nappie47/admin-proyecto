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

variable "create_service_account" {
  description = "Create dedicated service account for Cloud Run"
  type        = bool
  default     = true
}

variable "service_account_email" {
  description = "Existing service account email (if not creating)"
  type        = string
  default     = ""
}

variable "service_account_roles" {
  description = "Roles for Cloud Run service account"
  type        = map(string)
  default = {
    cloudsql_client = "roles/cloudsql.client"
    secret_accessor = "roles/secretmanager.secretAccessor"
    logging_writer  = "roles/logging.logWriter"
    monitoring_writer = "roles/monitoring.metricWriter"
    trace_agent     = "roles/cloudtrace.agent"
  }
}

variable "vpc_connector" {
  description = "Serverless VPC Access Connector ID"
  type        = string
}

variable "services" {
  description = "Map of Cloud Run services to deploy"
  type = map(object({
    image          = string
    cpu            = string
    memory         = string
    min_instances  = number
    max_instances  = number
    concurrency    = number
    env_vars       = map(string)
  }))
  default = {}
}

variable "secrets" {
  description = "Map of secrets to inject into containers"
  type = map(object({
    secret = string
  }))
  default = {}
}

variable "cloud_build_sa_email" {
  description = "Cloud Build service account email"
  type        = string
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = ""
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}