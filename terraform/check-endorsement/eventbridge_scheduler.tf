resource "aws_scheduler_schedule" "check_endorsements_schedule" {
  name        = "check-endorsements-schedule"
  group_name  = "default"
  description = "Schedule that checks XApp endorsements"
  state       = "ENABLED"

  schedule_expression          = "cron(0 9 ? * 1,3,6 *)"
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.check_endorsements.arn
    role_arn = aws_iam_role.scheduler_eventbridge_execution_role.arn
    input    = "{}"

    retry_policy {
      maximum_event_age_in_seconds = 86400
      maximum_retry_attempts       = 10
    }
  }
} 