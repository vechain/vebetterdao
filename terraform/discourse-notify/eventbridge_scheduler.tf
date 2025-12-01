resource "aws_scheduler_schedule" "discourse_notify_schedule" {
  name        = "discourse-notify-scheduler"
  group_name  = "default"
  description = "Schedule that fetch latest topics discussed in vebetterdao discourse"
  state       = "ENABLED"

  schedule_expression          = local.config.schedule_expression
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.discourse_notify.arn
    role_arn = aws_iam_role.scheduler_eventbridge_execution_role.arn
    input    = "{}"

    retry_policy {
      maximum_event_age_in_seconds = 86400
      maximum_retry_attempts       = 3
    }
  }
}
