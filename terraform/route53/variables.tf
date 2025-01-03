locals {
  env    = terraform.workspace
  config = yamldecode(file("./config/prod.yaml"))
}


data "aws_lb_hosted_zone_id" "current" {} 