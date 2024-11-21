terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
  backend "s3" {
    bucket = "b3tr-terraform-state-${terraform.workspace}"
    key    = "b3tr-mint-creator.tfstate"
    region = "eu-west-1"
    workspace_key_prefix = "workspaces"
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = {
      Terraform   = "true"
    }
  }
}
