resource "aws_scheduler_schedule" "distribute_weekly_app_rewards_schedule" {
  name        = "distribute-weekly-app-rewards-scheduler"
  group_name  = "default"
  description = "Schedule that distributes X-Allocations and DBA rewards for the previous round (runs 5 min after start-emissions-round)"
  state       = "ENABLED"

  schedule_expression          = local.config.schedule_expression
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.distribute_weekly_app_rewards.arn
    role_arn = aws_iam_role.scheduler_eventbridge_execution_role.arn
    input    = "{}"

    retry_policy {
      maximum_event_age_in_seconds = 86400
      maximum_retry_attempts       = 10
    }
  }
}
