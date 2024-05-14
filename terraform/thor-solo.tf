locals {
  env    = terraform.workspace
  config = yamldecode(file("${path.module}/config/${local.env}.yaml"))
}

data "aws_lb_hosted_zone_id" "current" {}
data "aws_region" "current" {}

##namespace
resource "aws_service_discovery_private_dns_namespace" "ns" {
  name = "${local.env}.${local.config.project}"
  vpc  = local.config.vpc_id
}

##thor-solo ecs service creation
module "thor_solo_node" {
  source              = "git@github.com:vechain/devops.git//ecs?ref=main"
  vpc_id              = local.config.vpc_id
  public_subnets      = local.config.public_subnets
  private_subnets     = local.config.private_subnets
  env                 = local.env
  common_ecr_repo     = true
  common_ecr_repo_url = "${local.base_registry_url}/${local.config.project}/thor-solo"
  internal_url_name   = "thor-solo.local"
  app_name            = "thor-solo"
  image_tag           = local.config.image_tag
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
