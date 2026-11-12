variable "key_ring_name" {
  description = "Name of the KMS Key Ring"
  type        = string
}

variable "region" {
  description = "GCP Region for KMS resources"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique names"
  type        = string
}

variable "keys" {
  description = "Map of crypto keys to create"
  type = map(object({
    purpose           = string
    rotation_period   = string
    iam_members       = optional(list(string))
  }))
  default = {}
}

variable "labels" {
  description = "Labels to apply to KMS resources"
  type        = map(string)
  default     = {}
}