locals {
  service_name             = "${local.env.environment}-governance"
  custom_domain_enabled    = lookup(local.env, "enable_custom_domain", false)
  ssm_parameter_prefix = lookup(local.env, "ssm_parameter_prefix", "/b3tr/frontend/")
  runtime_env_var_names = [
    "FRESHDESK_DOMAIN",
    "FRESHDESK_GROUP_ID",
    "RESET_USER_SIGNAL_COUNT_DOMAIN",
  ]
  runtime_env_secret_names = [
    "DISCORD_CLIENT_SECRET",
    "FRESHDESK_API_TOKEN",
    "GITHUB_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "RESET_USER_SIGNAL_COUNT_API_KEY",
    "TESTNET_STAGING_MNEMONIC",
    "TWITTER_CLIENT_SECRET",
    "DISCORD_CLIENT_ID",
    "GITHUB_CLIENT_ID",
    "TWITTER_CLIENT_ID",
  ]
}

data "aws_ssm_parameter" "runtime_env_vars" {
  for_each = toset(local.runtime_env_var_names)
  name     = "${local.ssm_parameter_prefix}${each.value}"
}

data "aws_ssm_parameter" "runtime_env_secrets" {
  for_each        = toset(local.runtime_env_secret_names)
  name            = "${local.ssm_parameter_prefix}${each.value}"
  with_decryption = true
}

resource "aws_apprunner_auto_scaling_configuration_version" "frontend" {
  auto_scaling_configuration_name = local.service_name

  max_concurrency = local.env.max_concurrency
  min_size        = local.env.min_size
  max_size        = local.env.max_size

  tags = merge(local.default_tags, {
    Name = "${local.service_name}-scaling"
  })
}

resource "aws_apprunner_service" "frontend" {
  service_name = local.service_name

  source_configuration {
    authentication_configuration {
      access_role_arn = data.terraform_remote_state.account_level.outputs.app_runner_access_role_arn
    }

    image_repository {
      image_identifier      = "${data.terraform_remote_state.account_level.outputs.ecr_repository_url}:${local.env.image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = tostring(local.env.port)
        runtime_environment_variables = {
            for name in local.runtime_env_var_names :
            name => data.aws_ssm_parameter.runtime_env_vars[name].value
          }
        runtime_environment_secrets = {
          for name in local.runtime_env_secret_names :
          name => data.aws_ssm_parameter.runtime_env_secrets[name].arn
        }
      }
    }

    auto_deployments_enabled = local.env.auto_deployments_enabled
  }

  instance_configuration {
    cpu               = tostring(local.env.cpu)
    memory            = tostring(local.env.memory)
    instance_role_arn = data.terraform_remote_state.account_level.outputs.app_runner_instance_role_arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.frontend.arn

  health_check_configuration {
    protocol            = "HTTP"
    path                = local.env.health_check_path
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  tags = {
    Name        = local.service_name
    Environment = local.env.environment
  }
}

resource "aws_apprunner_custom_domain_association" "frontend" {
  count = local.custom_domain_enabled ? 1 : 0

  domain_name          = local.env.domain
  service_arn          = aws_apprunner_service.frontend.arn
  enable_www_subdomain = false

  depends_on = [aws_apprunner_service.frontend]
}
