terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
  backend "s3" {
    # The states of DEV and PROD environments are stored in separate S3 buckets in their
    # respective AWS accounts. The {{{ENV}}} placeholder is replaced manually (dev/prod)
    bucket = "b3tr-terraform-state-{{{ENV}}}"
    key    = "b3tr-thor-solo.tfstate"
    region = "eu-west-1"
    workspace_key_prefix = "workspaces"
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = {
      Commit_Hash = data.external.git.result.sha
      Terraform   = "true"
    }
  }

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
