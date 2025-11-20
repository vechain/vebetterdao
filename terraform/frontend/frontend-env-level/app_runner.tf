locals {
  service_name             = coalesce(lookup(local.env, "service_name", null), "${local.env.project_name}-${local.env.environment}")
  custom_domain_enabled    = lookup(local.env, "enable_custom_domain", false)
  env_vars = merge(
    {
      NODE_ENV = local.env.node_env
      PORT     = tostring(local.env.port)
      HOSTNAME = "0.0.0.0"
    },
    lookup(local.env, "environment_variables", {})
  )
  ssm_parameter_prefix = "/b3tr/frontend/"
  runtime_env_var_names = [
    "FRESHDESK_DOMAIN",
    "FRESHDESK_GROUP_ID",
    "NEXT_PUBLIC_DELEGATOR_URL",
    "NEXT_PUBLIC_IPFS_PINNING_SERVICE",
    "NEXT_PUBLIC_NETWORK_TYPE",
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "NEXT_PUBLIC_PRIVY_CLIENT_ID",
    "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID",
    "RESET_USER_SIGNAL_COUNT_DOMAIN",
  ]
  runtime_env_secret_names = [
    "DISCORD_CLIENT_SECRET",
    "FRESHDESK_API_TOKEN",
    "GITHUB_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "NEXT_PUBLIC_NFT_STORAGE_KEY",
    "RESET_USER_SIGNAL_COUNT_API_KEY",
    "TESTNET_STAGING_MNEMONIC",
    "TWITTER_CLIENT_SECRET",
    "DISCORD_CLIENT_ID",
    "GITHUB_CLIENT_ID",
    "TWITTER_CLIENT_ID",
    "NEXT_PUBLIC_TRANSAK_API_KEY",
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
  auto_scaling_configuration_name = "${local.service_name}-scaling"

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
        runtime_environment_variables = merge(
          local.env_vars,
          {
            for name in local.runtime_env_var_names :
            name => data.aws_ssm_parameter.runtime_env_vars[name].value
          }
        )
        runtime_environment_secrets = {
          for name in local.runtime_env_secret_names :
          name => data.aws_ssm_parameter.runtime_env_secrets[name].arn
        }
      }
    }

    auto_deployments_enabled = lookup(local.env, "auto_deployments_enabled", false)
  }

  instance_configuration {
    cpu               = tostring(local.env.cpu)
    memory            = tostring(local.env.memory)
    instance_role_arn = data.terraform_remote_state.account_level.outputs.app_runner_instance_role_arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.frontend.arn

  health_check_configuration {
    protocol            = "HTTP"
    path                = lookup(local.env, "health_check_path", "/")
    interval            = lookup(local.env, "health_check_interval", 20)
    timeout             = lookup(local.env, "health_check_timeout", 10)
    healthy_threshold   = lookup(local.env, "health_check_healthy_threshold", 1)
    unhealthy_threshold = lookup(local.env, "health_check_unhealthy_threshold", 3)
  }

  tags = merge(local.default_tags, {
    Name = local.service_name
  })
}

resource "aws_apprunner_custom_domain_association" "frontend" {
  count = local.custom_domain_enabled ? 1 : 0

  domain_name          = local.env.domain
  service_arn          = aws_apprunner_service.frontend.arn
  enable_www_subdomain = false

  depends_on = [aws_apprunner_service.frontend]
}
