resource "aws_scheduler_schedule" "start_emissions_round_schedule" {
  name        = "emissions-distribute-scheduler"
  group_name  = "default"
  description = "Schedule that starts the emissions round"
  state       = "ENABLED"

  schedule_expression          = local.config.schedule_expression
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

# Emission cycles are measured in blocks and VeChain misses blocks, so the cycle start drifts
# later in wall-clock time every week. When the main schedule fires too early (round start more
# than the in-lambda waiting window away), these catch-up runs pick it up. The lambda skips
# idempotently once the round has started.
resource "aws_scheduler_schedule" "start_emissions_round_catchup_schedule" {
  name        = "emissions-distribute-catchup-scheduler"
  group_name  = "default"
  description = "Catch-up schedule that starts the emissions round when the main run fired before the cycle block was reached"
  state       = "ENABLED"

  schedule_expression          = local.config.catchup_schedule_expression
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