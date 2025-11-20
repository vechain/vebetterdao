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
    key     = "frontend-account-level.tfstate"
    workspace_key_prefix = "workspaces"
  }
}

locals {
  env         = yamldecode(file("../environments/account/${terraform.workspace}/${terraform.workspace}.yaml"))

  default_tags = {
      Project     = local.env.project_name
      Environment = local.env.environment
      Terraform   = "true"
      Workspace   = terraform.workspace
    }
}

provider "aws" {
  region = local.env.region

  dynamic "assume_role" {
    for_each = lookup(local.env, "assume_role_arn", null) == null ? [] : [local.env.assume_role_arn]
    content {
      role_arn     = assume_role.value
      session_name = "terraform-${local.env.project_name}-${local.env.environment}"
    }
  }

  default_tags {
    tags = local.default_tags
  }
}
