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

variable "kms_key_name" {
  description = "KMS key name for CMEK encryption"
  type        = string
  default     = ""
}

variable "rotation_sa_email" {
  description = "Service Account email for secret rotation"
  type        = string
  default     = ""
}

variable "secrets" {
  description = "Map of secrets to create"
  type = map(object({
    value     = string
    labels    = map(string)
    rotation  = optional(object({
      period = string
    }))
    description = optional(string)
    iam_members = optional(list(string))
  }))
  default = {}
}

variable "labels" {
  description = "Labels to apply to secrets"
  type        = map(string)
  default     = {}
}