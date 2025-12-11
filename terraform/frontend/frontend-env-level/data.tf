################################################################################
# Data Sources
################################################################################

data "terraform_remote_state" "account_level" {
  backend = "s3"
  config = {
    bucket = "b3tr-terraform-state-${local.env.environment == "prod" ? "prod" : "dev"}"
    key    = "workspaces/${local.env.environment == "prod" ? "prod" : "dev"}/frontend-account-level.tfstate"
    region = "eu-west-1"
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
