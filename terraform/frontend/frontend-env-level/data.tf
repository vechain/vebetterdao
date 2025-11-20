################################################################################
# Data Sources
################################################################################

data "terraform_remote_state" "account_level" {
  backend = "s3"
  config = {
    bucket = local.env.account_level_state_bucket
    key    = local.env.account_level_state_key
    region = lookup(local.env, "account_level_state_region", local.env.region)
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
