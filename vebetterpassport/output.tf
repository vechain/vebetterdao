output "reset_user_signals_api_url" {
  value = "${aws_api_gateway_stage.reset_user_signals_stage.invoke_url}/reset-user-signal-count"
}

output "resetUserSignalsWithReason_vebetterpassport_id" {
  value = aws_lambda_function.resetUserSignalsWithReason_vebetterpassport.id
}