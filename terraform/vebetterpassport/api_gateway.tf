# API Gateway REST API
resource "aws_api_gateway_rest_api" "reset_user_signals_api" {
  api_key_source               = "HEADER"
  disable_execute_api_endpoint = "false"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  name = "Reset User Signals With Reason - ${title(local.network)}"

  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

# API Gateway Resource
resource "aws_api_gateway_resource" "reset_user_signals_resource" {
  parent_id   = aws_api_gateway_rest_api.reset_user_signals_api.root_resource_id
  path_part   = "reset-user-signal-count"
  rest_api_id = aws_api_gateway_rest_api.reset_user_signals_api.id
}

# API Gateway Method
resource "aws_api_gateway_method" "reset_user_signals_method" {
  api_key_required = "true"
  authorization    = "NONE"
  http_method      = "POST"
  resource_id      = aws_api_gateway_resource.reset_user_signals_resource.id
  rest_api_id      = aws_api_gateway_rest_api.reset_user_signals_api.id
}

# API Gateway Integration
resource "aws_api_gateway_integration" "reset_user_signals_integration" {
  connection_type         = "INTERNET"
  content_handling        = "CONVERT_TO_TEXT"
  http_method             = "POST"
  integration_http_method = "POST"
  passthrough_behavior    = "WHEN_NO_MATCH"
  resource_id             = aws_api_gateway_resource.reset_user_signals_resource.id
  rest_api_id             = aws_api_gateway_rest_api.reset_user_signals_api.id
  timeout_milliseconds    = "29000"
  type                    = "AWS"
  uri                     = "arn:aws:apigateway:eu-west-1:lambda:path/2015-03-31/functions/${aws_lambda_function.resetUserSignalsWithReason_vebetterpassport.arn}/invocations"
}

# API Gateway Method Response
resource "aws_api_gateway_method_response" "reset_user_signals_method_response" {
  http_method = aws_api_gateway_method.reset_user_signals_method.http_method
  resource_id = aws_api_gateway_resource.reset_user_signals_resource.id
  rest_api_id = aws_api_gateway_rest_api.reset_user_signals_api.id
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
}

# API Gateway Integration Response
resource "aws_api_gateway_integration_response" "reset_user_signals_integration_response" {
  http_method = aws_api_gateway_method.reset_user_signals_method.http_method
  resource_id = aws_api_gateway_resource.reset_user_signals_resource.id
  rest_api_id = aws_api_gateway_rest_api.reset_user_signals_api.id
  status_code = aws_api_gateway_method_response.reset_user_signals_method_response.status_code
  response_templates = {
    "application/json" = ""
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "reset_user_signals_stage" {
  deployment_id = aws_api_gateway_deployment.reset_user_signals_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.reset_user_signals_api.id
  stage_name    = "default"

  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "reset_user_signals_deployment" {
  rest_api_id = aws_api_gateway_rest_api.reset_user_signals_api.id

  depends_on = [
    aws_api_gateway_integration.reset_user_signals_integration
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# terraform import aws_api_gateway_resource.reset_user_signals_resource m0xna6yoc6/si8suu
# terraform import aws_api_gateway_method.reset_user_signals_method m0xna6yoc6/si8suu/POST
# terraform import aws_api_gateway_integration.reset_user_signals_integration m0xna6yoc6/si8suu/POST
# terraform import aws_api_gateway_method_response.reset_user_signals_method_response m0xna6yoc6/si8suu/POST/200
# terraform import aws_api_gateway_integration_response.reset_user_signals_integration_response m0xna6yoc6/si8suu/POST/200
# terraform import aws_api_gateway_stage.reset_user_signals_stage m0xna6yoc6/default
# terraform import aws_api_gateway_deployment.reset_user_signals_deployment m0xna6yoc6/abc123
# terraform import aws_lambda_permission.resetUserSignalsWithReason_permission resetUserSignalsWithReason_vebetterpassport_testnet/apigateway.amazonaws.com


