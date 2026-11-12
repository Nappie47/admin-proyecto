variable "project_id" {
  description = "GCP Project ID"
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

variable "repository_name" {
  description = "Repository name"
  type        = string
}

variable "format" {
  description = "Repository format (DOCKER, MAVEN, NPM, PYTHON)"
  type        = string
  default     = "DOCKER"
}

variable "enable_vulnerability_scanning" {
  description = "Enable vulnerability scanning"
  type        = bool
  default     = true
}

variable "reader_members" {
  description = "Members with reader role"
  type        = list(string)
  default     = []
}

variable "writer_members" {
  description = "Members with writer role"
  type        = list(string)
  default     = []
}

variable "admin_members" {
  description = "Members with admin role"
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}