resource "aws_scheduler_schedule" "relayer_claim_reward_schedule" {
  name        = "relayer-claim-reward-scheduler"
  group_name  = "default"
  description = "Schedule that claims rewards on behalf of users with auto-voting enabled"
  state       = "ENABLED"

  schedule_expression          = local.config.schedule_expression
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.relayer_claim_reward.arn
    role_arn = aws_iam_role.scheduler_eventbridge_execution_role.arn
    input    = "{}"

    retry_policy {
      maximum_event_age_in_seconds = 86400
      maximum_retry_attempts       = 10
    }
  }
}

