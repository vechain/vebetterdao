variable "domain_name_data" {
  description = "Domain name configuration per workspace"
  type = map(object({
    suffix  = string
    zone_id = string
  }))
}

locals {
  env    = terraform.workspace
  config = yamldecode(file("${path.module}/../config/${local.env}.yaml"))
}

data "aws_lb_hosted_zone_id" "current" {} 