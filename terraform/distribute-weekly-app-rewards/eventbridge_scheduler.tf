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

# Emission cycles drift later in wall-clock time every week (cycles are measured in blocks and
# VeChain misses blocks), so the main schedule can fire before the new round has started. These
# catch-up runs distribute rewards shortly after the round actually starts; the lambda skips
# idempotently while the round is still pending and after rewards have been distributed.
resource "aws_scheduler_schedule" "distribute_weekly_app_rewards_catchup_schedule" {
  name        = "distribute-weekly-app-rewards-catchup-scheduler"
  group_name  = "default"
  description = "Catch-up schedule that distributes weekly app rewards when the main run fired before the round started"
  state       = "ENABLED"

  schedule_expression          = local.config.catchup_schedule_expression
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
