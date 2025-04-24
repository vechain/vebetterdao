terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
  }
  
  required_version = ">= 1.0.0"
  backend "s3" {
    bucket = "b3tr-terraform-state-dev"
    key    = "b3tr-vebetterpassport.tfstate"
    region = "eu-west-1"
    workspace_key_prefix = "workspaces"
  }
}

provider "aws" {
  region = "eu-west-1"
  
  default_tags {
    tags = {
      Environment = terraform.workspace == "dev" ? "testnet" : "mainnet"
      Project     = "vebetterpassport"
      ManagedBy   = "terraform"
    }
  }
}
