terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    datadog = {
      source = "DataDog/datadog"
    }
  }
  backend "s3" {
    bucket = "b3tr-terraform-state-testnet"
    key    = "b3tr-thor-solo.tfstate"
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

provider "datadog" {
  api_key = try(jsondecode(data.aws_secretsmanager_secret_version.datadog_api_keys.secret_string)["datadog_api_key"], "")
  app_key = try(jsondecode(data.aws_secretsmanager_secret_version.datadog_api_keys.secret_string)["datadog_app_key"], "")
  validate = var.enable_datadog_integration_aws
  api_url = "https://api.datadoghq.eu/"
}

data "external" "git" {
  program = [
    "git",
    "log",
    "--pretty=format:{ \"sha\": \"%H\" }",
    "-1",
    "HEAD"
  ]
}


data "aws_secretsmanager_secret_version" "datadog_api_keys" {
  secret_id = local.config.secret_id
}
