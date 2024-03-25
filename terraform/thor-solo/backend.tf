terraform {
  backend "s3" {
    key    = "b3tr-thor-solo/terraform.tfstate"
    region = "eu-west-1"
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
