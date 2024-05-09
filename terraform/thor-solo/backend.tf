terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
  backend "s3" {
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
