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

variable "tier" {
  description = "Redis tier (BASIC, STANDARD_HA)"
  type        = string
  default     = "BASIC"
}

variable "memory_size_gb" {
  description = "Memory size in GB"
  type        = number
  default     = 1
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_7_0"
}

variable "auth_enabled" {
  description = "Enable Redis AUTH"
  type        = bool
  default     = true
}

variable "auth_password" {
  description = "Redis AUTH password"
  type        = string
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}