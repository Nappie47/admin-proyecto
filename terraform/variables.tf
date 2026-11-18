# ============================================================
# Terraform Variables - Unidad 3 AWS Infrastructure
# ============================================================

variable "aws_region" {
  description = "Región de AWS para desplegar la infraestructura"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo para los nombres de los recursos"
  type        = string
  default     = "cementerio-los-angeles-u3"
}

variable "environment" {
  description = "Entorno de ejecución"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "Bloque CIDR de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "Bloque CIDR de la Subred Pública (Gateway / Ingress)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "Bloque CIDR de la Subred Privada (Backend, BD, Servicios Internos)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "availability_zone" {
  description = "Zona de disponibilidad"
  type        = string
  default     = "us-east-1a"
}

variable "admin_ssh_ip" {
  description = "Dirección IP pública del administrador autorizada para SSH (ej. 190.160.x.x/32)"
  type        = string
  default     = "0.0.0.0/0" # Reemplazar con IP real del alumno para cumplir hardening
}

variable "instance_type" {
  description = "Tipo de instancia EC2 para el clúster Docker"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Nombre del par de llaves Ed25519 en AWS EC2"
  type        = string
  default     = "cemetery-u3-key"
}

variable "enable_nat_gateway" {
  description = "Habilitar NAT Gateway en la subred pública para egress privado (o false si se usa NAT Instance)"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Etiquetas comunes aplicadas a todos los recursos de AWS"
  type        = map(string)
  default = {
    Project     = "Cementerio-Los-Angeles"
    Unidad      = "Unidad-3"
    Asignatura  = "Administracion-de-Redes"
    Profesor    = "Ricardo-Perez"
    Integrantes = "Bryan-Ahumada-Johan-Munoz"
    ManagedBy   = "Terraform"
  }
}
