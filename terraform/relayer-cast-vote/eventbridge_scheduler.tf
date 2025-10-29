resource "aws_scheduler_schedule" "relayer_cast_vote_schedule" {
  name        = "relayer-cast-vote-scheduler"
  group_name  = "default"
  description = "Schedule that casts votes on behalf of users with auto-voting enabled"
  state       = "ENABLED"

  schedule_expression          = local.config.schedule_expression
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.relayer_cast_vote.arn
    role_arn = aws_iam_role.scheduler_eventbridge_execution_role.arn
    input    = "{}"

    retry_policy {
      maximum_event_age_in_seconds = 86400
      maximum_retry_attempts       = 10
    }
  }
}

