resource "aws_scheduler_schedule" "finalize_challenges_schedule" {
  name        = "finalize-challenges-scheduler"
  group_name  = "default"
  description = "Schedule that finalizes ended challenges after round distribution"
  state       = "ENABLED"

  schedule_expression          = local.config.schedule_expression
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.finalize_challenges.arn
    role_arn = aws_iam_role.scheduler_eventbridge_execution_role.arn
    input    = "{}"

    retry_policy {
      maximum_event_age_in_seconds = 86400
      maximum_retry_attempts       = 10
    }
  }
}
