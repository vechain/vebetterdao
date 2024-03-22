locals {
  env    = terraform.workspace
  config = yamldecode(file("../thor-solo/../config/${local.env}.yaml"))
}

data "aws_lb_hosted_zone_id" "current" {}
data "aws_region" "current" {}

##namespace
resource "aws_service_discovery_private_dns_namespace" "ns" {
  name = "${local.env}.${local.config.project}"
  vpc  = local.config.vpc_id
}

## ecr creation
module "ecr" {
  source               = "git@github.com:vechainfoundation/devops.git//ecr?ref=5bcedfa"
  ecr_name             = var.ecr_names
  project              = local.config.project
  env                  = local.env
  image_tag_mutability = "MUTABLE"
}
##cert creation
locals {
  domains = [
    { name : "thor-solo.${var.domain_name_data[terraform.workspace].suffix}", zone : var.domain_name_data[terraform.workspace].zone_id },
  ]
  base_registry_url = "${module.ecr.registry_id[0]}.dkr.ecr.eu-west-1.amazonaws.com"
}
module "thor-solo_domain" {
  source = "git@github.com:vechainfoundation/devops.git//domains?ref=5bcedfa"

  domain_name = local.domains[0].name
  zone_id     = local.domains[0].zone

  create_domain_alias = true
  lb_dns_name         = module.thor_solo_node.aws_alb[0].dns_name
  lb_zone_id          = data.aws_lb_hosted_zone_id.current.id
}

##thor-solo ecs service creation
module "thor_solo_node" {
  source              = "git@github.com:vechainfoundation/devops.git//ecs?ref=5bcedfa"
  vpc_id              = local.config.vpc_id
  public_subnets      = local.config.public_subnets
  private_subnets     = local.config.private_subnets
  env                 = local.env
  common_ecr_repo     = true
  common_ecr_repo_url = "${local.base_registry_url}/${local.env}-${local.config.project}-thor-solo"
  internal_url_name   = "thor-solo.local"
  app_name            = "thor-solo"
  image_tag           = "latest"
  project             = local.config.project
  cpu                 = 256
  memory              = 512
  cidr                = local.config.vpc_cidr
  desired_capacity    = "1"
  container_port      = 8669
  host_port           = 8669
  certificate_arn     = module.thor-solo_domain.certificate_arn
  alb_path_rule       = ["/"]
  health_check_path   = "/blocks/0"
  secrets_enable      = "false"
  lb_enable           = "true"
  namespace           = aws_service_discovery_private_dns_namespace.ns.id
  log_metric_filters = [
    {
      name    = "AppUnhealthy",
      pattern = "Application is UNHEALTHY"
    }
  ]
  environment_variables = [

  ]
  runtime_platform = var.runtime_platform
}
