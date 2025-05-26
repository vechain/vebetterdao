resource "aws_scheduler_schedule" "start_emissions_round_schedule" {
  name        = "emissions-distribute-scheduler"
  group_name  = "default"
  description = "Schedule that starts the emissions round"
  state       = "ENABLED"

  schedule_expression          = "cron(30 1 ? * MON *)"
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.start_emissions_round.arn
    role_arn = aws_iam_role.scheduler_eventbridge_execution_role.arn
    input    = "{}"

    retry_policy {
      maximum_event_age_in_seconds = 86400
      maximum_retry_attempts       = 10
    }
  }
} 