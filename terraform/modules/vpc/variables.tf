variable "network_name" {
  description = "Name of the VPC network"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique names"
  type        = string
}

variable "public_subnet_cidr" {
  description = "CIDR range for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR range for private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "enable_nat" {
  description = "Enable Cloud NAT"
  type        = bool
  default     = true
}

variable "nat_min_ports_per_vm" {
  description = "Minimum ports per VM for Cloud NAT"
  type        = number
  default     = 64
}

variable "enable_vpc_connector" {
  description = "Enable Serverless VPC Access Connector"
  type        = bool
  default     = true
}

variable "enable_ssh_bastion" {
  description = "Enable SSH access from bastion IPs"
  type        = bool
  default     = false
}

variable "bastion_ips" {
  description = "List of allowed bastion IPs for SSH"
  type        = list(string)
  default     = []
}

variable "allowed_lb_ranges" {
  description = "IP ranges allowed for Load Balancer health checks and traffic"
  type        = list(string)
  default     = ["35.191.0.0/16", "130.211.0.0/22"]
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}