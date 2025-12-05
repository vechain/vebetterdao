################################################################################
# Shared App Runner Auto Scaling Configurations
################################################################################
# 
# Used by App Runner services
resource "aws_apprunner_auto_scaling_configuration_version" "app_runner_scaler" {
  auto_scaling_configuration_name = "AppRunnerScaler-${local.env.environment}"

  max_concurrency = 100
  min_size        = local.env.min_size
  max_size        = local.env.max_size
}
