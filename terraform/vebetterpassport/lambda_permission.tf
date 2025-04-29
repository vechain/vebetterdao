# Lambda Permission
resource "aws_lambda_permission" "resetUserSignalsWithReason_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resetUserSignalsWithReason_vebetterpassport.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-1:${local.account_id}:${aws_api_gateway_rest_api.reset_user_signals_api.id}/*/POST/reset-user-signal-count"
  statement_id  = "api-gateway-invoke-${local.network}"
} 