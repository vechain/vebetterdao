terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    archive = {
      source = "hashicorp/archive"
    }
  }

  required_version = ">= 1.0.0"
  backend "s3" {
    key                  = "b3tr-check-endorsement.tfstate"
    region               = "eu-west-1"
    workspace_key_prefix = "workspaces"
  }
}

# Load workspace configuration from YAML
locals {
  config     = yamldecode(file("${path.module}/config/${terraform.workspace}.yaml"))
  network    = local.config.environment
  account_id = local.config.aws_account_id
}

provider "aws" {
  region = local.config.aws_region

  default_tags {
    tags = {
      Environment = local.network
      Project     = "check-endorsement"
      ManagedBy   = "terraform"
    }
  }
}
