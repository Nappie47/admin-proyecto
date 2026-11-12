variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "suffix" {
  description = "Random suffix"
  type        = string
}

variable "policy_name" {
  description = "Security policy name"
  type        = string
}

variable "enable_owasp_rules" {
  description = "Enable OWASP CRS rules"
  type        = bool
  default     = true
}

variable "enable_rate_limiting" {
  description = "Enable rate limiting"
  type        = bool
  default     = true
}

variable "rate_limit_threshold" {
  description = "Rate limit threshold (requests per minute per IP)"
  type        = number
  default     = 1000
}

variable "block_tor" {
  description = "Block TOR exit nodes"
  type        = bool
  default     = false
}

variable "tor_exit_nodes" {
  description = "List of TOR exit node IPs"
  type        = list(string)
  default     = []
}

variable "blocked_countries" {
  description = "List of country IPs to block (optional)"
  type        = list(string)
  default     = null
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}