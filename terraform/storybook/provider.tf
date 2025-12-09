terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    key                  = "b3tr/storybook.tfstate"
    region               = "eu-west-1"
    workspace_key_prefix = "workspaces"
    encrypt              = true
  }
}

provider "aws" {
  region = local.env.region

  default_tags {
    tags = {
      Terraform   = "true"
      Project     = local.env.project
      Environment = local.env.environment
      Workspace   = terraform.workspace
    }
  }
}

# Provider for us-east-1 - required for looking up ACM certificates used by CloudFront
provider "aws" {
  alias  = "useast1"
  region = "us-east-1"

  default_tags {
    tags = {
      Terraform   = "true"
      Project     = local.env.project
      Environment = local.env.environment
      Workspace   = terraform.workspace
    }
  }
}

