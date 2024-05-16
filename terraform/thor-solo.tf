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

######################
# Public ALB Security Group
######################

resource "aws_security_group" "alb-sg" {
  description = "security-group-alb"
  name        = "${local.env}-${local.config.project}-sg-alb"
  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 0
    protocol    = "-1"
    to_port     = 0
  }

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 80
    protocol    = "tcp"
    to_port     = 80
  }

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 443
    protocol    = "tcp"
    to_port     = 443
  }

  tags = {
    Environment = local.env
    Name        = "${local.env}-${local.config.project}-sg-alb"
  }
  vpc_id = local.config.vpc_id
}

######################
# ECS Service Security Group
######################

resource "aws_security_group" "ecs_service_sg" {
  description = "security-group-service"

  name = "${local.env}-${local.config.project}-sg-service"
  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 0
    protocol    = "-1"
    to_port     = 0
  }
  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 0
    protocol    = "-1"
    to_port     = 0
  }
  ingress {
    from_port = 0
    protocol  = "-1"
    to_port   = 0
    self      = true
  }

  tags = {
    Environment = local.env
    Name        = "${local.env}-${local.config.project}-sg-service"
  }

  vpc_id = local.config.vpc_id
}

################################################################################
# Module For ECS Cluster creation
################################################################################

module "ecs-cluster" {
  source  = "git::git@github.com:/vechain/terraform_infrastructure_modules.git//ecs_cluster?ref=v.1.0.19"
  env     = local.config.environment
  project = local.config.project
  vpc_id  = data.terraform_remote_state.vpc.outputs.vpc_id
  cidr    = data.terraform_remote_state.vpc.outputs.vpc_ipv4
}

################################################################################
# Module For ECS Load Balanced Thor-Solo Service
################################################################################

module "ecs-lb-service-thor-solo" {
  depends_on                 = [module.ecs-cluster, resource.aws_security_group.ecs_service_sg, resource.aws_security_group.alb-sg]
  source                     = "git::git@github.com:/vechain/terraform_infrastructure_modules.git//ecs-loadbalanced-webservice?ref=v.1.0.21"
  region                     = local.config.region
  vpc_id                     = local.config.vpc_id
  cluster_name               = module.ecs-cluster.name
  autoscale_cluster_name     = module.ecs-cluster.name
  lb_subnets                 = local.config.private_subnets
  internal_alb               = true
  app_subnets                = local.config.private_subnets
  env                        = local.config.environment
  is_create_repo             = false
  ecr_repo_uri               = module.ecr.repository_url
  secrets_enable             = false
  assign_public_ip           = false
  app_name                   = "${local.config.project}-${local.env}"
  ecr_image_tag              = local.config.image_tag
  project                    = local.config.project
  cpu                        = local.config.cpu
  memory                     = local.config.memory
  cidr                       = local.config.cidr
  container_port             = 8669
  certificate_arn            = module.thor-solo_domain.certificate_arn
  ecs_sg                     = [aws_security_group.ecs_service_sg.id]
  rule_0_path_pattern        = ["/api/v*", "/api-docs", "/swagger-ui/*"]
  alb_sg                     = [aws_security_group.internal-alb-sg.id]
  enable_deletion_protection = local.env == "prod" ? true : false
  namespace_id               = aws_service_discovery_private_dns_namespace.ns.id
  https_tg_healthcheck_path  = "/blocks/0"
  environment_variables = []
  log_metric_filters = [
    {
      name    = "AppUnhealthy",
      pattern = "Application is UNHEALTHY"
    }
  ]

  ####### enable autoscailing #######
  enable_ecs_cpu_based_autoscaling    = true
  enable_ecs_memory_based_autoscaling = true
  min_capacity                        = 1
  max_capacity                        = each.value.mass.max_capacity
  target_cpu_value                    = 70
  target_memory_value                 = 70
  disable_scale_in                    = false
  # scale_in_cooldown = 300
  # scale_out_cooldown = 300
  name = "auto-scaling-group"
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
  cpu                 = local.config.cpu
  memory              = local.config.memory
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
