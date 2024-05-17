##cert creation
locals {
  domains = [
    { name : "thor-solo.${var.domain_name_data[terraform.workspace].suffix}", zone : var.domain_name_data[terraform.workspace].zone_id },
    { name : "insight.${var.domain_name_data[terraform.workspace].suffix}", zone : var.domain_name_data[terraform.workspace].zone_id },
    { name : "inspector.${var.domain_name_data[terraform.workspace].suffix}", zone : var.domain_name_data[terraform.workspace].zone_id },
  ]
  base_registry_url = "${module.ecr.registry_id[0]}.dkr.ecr.eu-west-1.amazonaws.com"
}
module "thor-solo_domain" {
  depends_on = [module.ecs-lb-service-thor-solo]
  source     = "git@github.com:vechain/terraform_infrastructure_modules.git//domains?ref=v.1.0.23"

  domain_name = local.domains[0].name
  zone_id     = local.domains[0].zone

  create_domain_alias = true
  lb_dns_name         = module.ecs-lb-service-thor-solo.alb_dns_name
  lb_zone_id          = data.aws_lb_hosted_zone_id.current.id
}
