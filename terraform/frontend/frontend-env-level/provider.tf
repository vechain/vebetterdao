terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Bucket is supplied via backend config files per workspace.
    region  = "eu-west-1"
    encrypt = true
    key     = "frontend-env-level.tfstate"
    workspace_key_prefix = "workspaces"
  }
}

locals {
  env         = yamldecode(file("../environments/env/${terraform.workspace}/${terraform.workspace}.yaml"))

  default_tags = {
    Project     = local.env.project_name
    Environment = local.env.environment
    ManagedBy   = "terraform"
    Workspace   = terraform.workspace
  }
}

provider "aws" {
  region = local.env.region

  default_tags {
    tags = local.default_tags
  }
}
