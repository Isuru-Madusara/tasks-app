terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "region" {
  default = "eu-north-1"
}

variable "instance_type" {
  default = "t3.micro"
}

variable "my_ip_cidr" {
  description = "175.157.45.115"
  type        = string
}

variable "public_key_path" {
  default = "~/.ssh/tasks-key.pub"
}

provider "aws" {
  region = var.region
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_key_pair" "app" {
  key_name   = "tasks-key"
  public_key = file(pathexpand(var.public_key_path))
}

resource "aws_security_group" "app" {
  name        = "tasks-app-sg"
  description = "Allow HTTP from anywhere and SSH from my IP"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.app.key_name
  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = <<-EOF
    #!/bin/bash
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker ubuntu
  EOF

  root_block_device {
    volume_size = 12
  }

  tags = {
    Name = "tasks-app-server"
  }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
}

output "public_ip" {
  value = aws_eip.app.public_ip
}

output "app_url" {
  value = "http://${aws_eip.app.public_ip}"
}