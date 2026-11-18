# ============================================================
# Terraform Outputs - Unidad 3 AWS
# ============================================================

output "vpc_id" {
  description = "ID de la VPC creada"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID de la subred pública"
  value       = aws_subnet.public.id
}

output "private_subnet_id" {
  description = "ID de la subred privada"
  value       = aws_subnet.private.id
}

output "ec2_public_ip" {
  description = "Dirección IP pública del servidor de aplicaciones (Ingress Gateway)"
  value       = aws_instance.app_server.public_ip
}

output "ec2_private_ip" {
  description = "Dirección IP privada de la instancia EC2"
  value       = aws_instance.app_server.private_ip
}

output "s3_backup_bucket_name" {
  description = "Nombre del bucket S3 cifrado para respaldos"
  value       = aws_s3_bucket.backups.bucket
}

output "kms_key_arn" {
  description = "ARN de la llave KMS CMEK utilizada para EBS y S3"
  value       = aws_kms_key.cemetery_key.arn
}

output "gateway_security_group_id" {
  description = "ID del Security Group público (Gateway)"
  value       = aws_security_group.gateway.id
}

output "internal_security_group_id" {
  description = "ID del Security Group interno encadenado"
  value       = aws_security_group.internal_app.id
}
