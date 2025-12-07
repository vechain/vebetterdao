locals {
  service_name             = "governance-${local.env.environment}"
  custom_domain_enabled    = lookup(local.env, "enable_custom_domain", false)
  ssm_parameter_prefix = lookup(local.env, "ssm_parameter_prefix", "/b3tr/frontend/")
}

data "aws_ssm_parameter" "runtime_env_vars" {
  for_each = toset(local.env.runtime_env_var_names)
  name     = "${local.ssm_parameter_prefix}${each.value}"
}

data "aws_ssm_parameter" "runtime_env_secrets" {
  for_each        = toset(local.env.runtime_env_secret_names)
  name            = "${local.ssm_parameter_prefix}${each.value}"
  with_decryption = true
}

locals {
  autoscaling_config_arn = data.terraform_remote_state.account_level.outputs.app_runner_scaler_arn
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
            for name in local.env.runtime_env_var_names :
            name => data.aws_ssm_parameter.runtime_env_vars[name].value
          }
        runtime_environment_secrets = {
          for name in local.env.runtime_env_secret_names :
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

  auto_scaling_configuration_arn = local.autoscaling_config_arn

  health_check_configuration {
    protocol            = "HTTP"
    path                = local.env.health_check_path
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  tags = merge(local.default_tags, {
    Name = local.env.project_slug
    Environment = local.env.environment
  })
}

resource "aws_apprunner_custom_domain_association" "frontend" {
  count = local.custom_domain_enabled ? 1 : 0

  domain_name          = local.env.domain
  service_arn          = aws_apprunner_service.frontend.arn
  enable_www_subdomain = false

  depends_on = [aws_apprunner_service.frontend]
}
