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

variable "notification_email" {
  description = "Email for alert notifications"
  type        = string
}

variable "slack_channel" {
  description = "Slack channel for notifications"
  type        = string
  default     = ""
}

variable "slack_token" {
  description = "Slack bot token"
  type        = string
  default     = ""
}

variable "enable_email_notifications" {
  description = "Enable email notifications"
  type        = bool
  default     = true
}

variable "enable_slack_notifications" {
  description = "Enable Slack notifications"
  type        = bool
  default     = false
}

variable "api_domain" {
  description = "API domain for uptime checks"
  type        = string
}

variable "frontend_domain" {
  description = "Frontend domain for uptime checks"
  type        = string
}

variable "billing_budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 100
}

variable "enable_uptime_checks" {
  description = "Enable uptime checks"
  type        = bool
  default     = true
}

variable "services" {
  description = "Map of Cloud Run services"
  type = map(object({
    name = string
  }))
  default = {}
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}