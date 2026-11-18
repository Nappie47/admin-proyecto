# ============================================================
# Terraform Main Configuration - Unidad 3 AWS
# ============================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.common_tags
  }
}

# ============================================================
# PARTE A.1: VPC y Segmentación de Red
# ============================================================

# 1. VPC Propia (No default)
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# 2. Subred Pública (Gateway / Ingress / Proxy)
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
    Tier = "Public-Ingress"
  }
}

# 3. Subred Privada (Backend, BD, Servicios Internos)
resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-subnet"
    Tier = "Private-Backend-DB"
  }
}

# 4. Internet Gateway (IGW) para la Subred Pública
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# 5. Elastic IP y NAT Gateway para Egress Seguro de la Subred Privada
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

resource "aws_nat_gateway" "nat" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "${var.project_name}-nat-gateway"
  }

  depends_on = [aws_internet_gateway.igw]
}

# 6. Tablas de Rutas
# Ruta Pública -> Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Ruta Privada -> NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.nat[0].id
    }
  }

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# ============================================================
# PARTE D.1: Security Groups con Política Default-Deny y Encadenamiento
# ============================================================

# Security Group 1: Gateway / Ingress Público
resource "aws_security_group" "gateway" {
  name        = "${var.project_name}-gateway-sg"
  description = "SG para Gateway L7 con acceso web HTTP/HTTPS y SSH restringido"
  vpc_id      = aws_vpc.main.id

  # HTTP (80) -> Redireccion a HTTPS
  ingress {
    description = "HTTP Ingress for Redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS (443) -> Trafico cifrado principal
  ingress {
    description = "HTTPS Secure Ingress"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH (22) -> Restringido exclusivamente a la IP del administrador
  ingress {
    description = "SSH Admin Access (IP especifica)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ssh_ip]
  }

  # Egress permitido
  egress {
    description = "Allow Outbound Traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-gateway-sg"
  }
}

# Security Group 2: Servicios Internos (Backend, DB) - ENCADENADO
resource "aws_security_group" "internal_app" {
  name        = "${var.project_name}-internal-app-sg"
  description = "SG Interno encadenado: solo acepta conexiones originadas desde sg-gateway"
  vpc_id      = aws_vpc.main.id

  # Backend API (5000) solo desde el Gateway
  ingress {
    description     = "API access only from Gateway SG"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id]
  }

  # PostgreSQL DB (5432) solo desde el Gateway/Backend
  ingress {
    description     = "Database access only from Gateway/Backend SG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id]
  }

  # Monitoreo interno (Prometheus 9090 / Grafana 3000) solo desde Gateway
  ingress {
    description     = "Monitoring access only from Gateway SG"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id]
  }

  egress {
    description = "Allow internal outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-internal-app-sg"
  }
}

# ============================================================
# PARTE C.3: Criptografía en Reposo (KMS) y Respaldos S3
# ============================================================

# Llave KMS administrada por el cliente (CMEK)
resource "aws_kms_key" "cemetery_key" {
  description             = "Llave KMS CMEK para cifrado de volumenes EBS y respaldos S3 de Unidad 3"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-kms-key"
  }
}

resource "aws_kms_alias" "cemetery_key_alias" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.cemetery_key.key_id
}

# Bucket S3 para Respaldos de la Unidad 2
resource "aws_s3_bucket" "backups" {
  bucket        = "${var.project_name}-backups-${var.environment}"
  force_destroy = false

  tags = {
    Name = "${var.project_name}-backups-bucket"
  }
}

# Versionado activado en S3
resource "aws_s3_bucket_versioning" "backups_versioning" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Cifrado en reposo obligatorio con KMS (SSE-KMS)
resource "aws_s3_bucket_server_side_encryption_configuration" "backups_encryption" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cemetery_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Bloqueo total de acceso publico en S3
resource "aws_s3_bucket_public_access_block" "backups_access_block" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================
# PARTE A.2: Identidad y Control de Acceso (IAM Instance Profile)
# ============================================================

resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Politica de permisos minimos: Acceso al bucket S3 y KMS
resource "aws_iam_role_policy" "s3_backup_policy" {
  name = "${var.project_name}-s3-backup-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3BackupAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      },
      {
        Sid    = "KMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [aws_kms_key.cemetery_key.arn]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# ============================================================
# INSTANCIA EC2 - Servidor Docker con Hardening y Cifrado EBS
# ============================================================

# AMI Ubuntu 22.04 LTS Oficial
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app_server" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  subnet_id            = aws_subnet.public.id
  key_name             = var.key_name
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  vpc_security_group_ids = [
    aws_security_group.gateway.id,
    aws_security_group.internal_app.id
  ]

  # Volumen EBS cifrado con llave KMS (Requisito 4.3)
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    kms_key_id            = aws_kms_key.cemetery_key.arn
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-root-volume"
    }
  }

  # Metadatos seguros obligatorios IMDSv2 (Defensa contra SSRF)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 forzado
    http_put_response_hop_limit = 1
  }

  tags = {
    Name = "${var.project_name}-docker-server"
    Role = "Application-Gateway-Database"
  }
}
