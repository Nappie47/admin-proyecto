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

variable "github_owner" {
  description = "GitHub organization/owner"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "service_accounts" {
  description = "Map of service accounts to create"
  type = map(object({
    display_name = string
    description  = string
    roles        = list(string)
  }))
  default = {}
}

variable "custom_roles" {
  description = "Map of custom roles to create"
  type = map(object({
    title       = string
    description = string
    permissions = list(string)
  }))
  default = {}
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}