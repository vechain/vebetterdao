resource "aws_api_gateway_rest_api" "mint_creator_nft_api" {
  api_key_source               = "HEADER"
  description                  = "API Gateway for Creator NFT Mint Lambda. This gateway works as a layer of API Key authentication for accessing the mint lambda"
  disable_execute_api_endpoint = "false"

  endpoint_configuration {
    types = ["EDGE"]
  }

  name = "mint-creator-nft-api-gateway"
}

resource "aws_api_gateway_api_key" "freshdesk_api_key_name" {
  name = "FreshdeskWebhookTrigger"
  description = "Api Key for Freshdesk Webhook Trigger call"
}

resource "aws_api_gateway_deployment" "mint_creator_nft_deployment" {
  rest_api_id = aws_api_gateway_rest_api.mint_creator_nft_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.mint_creator_nft_api.root_resource_id,
      aws_api_gateway_method.mint_creator_nft_post_req.id,
      aws_api_gateway_integration.mint_creator_nft_api_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "mint_creator_nft_stage" {
  cache_cluster_enabled = "false"
  deployment_id         = aws_api_gateway_deployment.mint_creator_nft_deployment.id
  rest_api_id           = aws_api_gateway_rest_api.mint_creator_nft_api.id
  stage_name            = "${local.network}-creator-nft"
  xray_tracing_enabled  = "false"
}

resource "aws_api_gateway_method_response" "mint_creator_nft_post_resp" {
  depends_on = [aws_api_gateway_integration.mint_creator_nft_api_integration]
  http_method = "POST"
  resource_id = aws_api_gateway_rest_api.mint_creator_nft_api.root_resource_id

  response_models = {
    "application/json" = "Empty"
  }

  rest_api_id = aws_api_gateway_rest_api.mint_creator_nft_api.id
  status_code = "200"
}

resource "aws_api_gateway_method" "mint_creator_nft_post_req" {
  api_key_required = "true"
  authorization    = "AWS_IAM"
  http_method      = "POST"
  resource_id      = aws_api_gateway_rest_api.mint_creator_nft_api.root_resource_id
  rest_api_id      = aws_api_gateway_rest_api.mint_creator_nft_api.id
}

resource "aws_api_gateway_usage_plan" "client_usage_plan" {
  depends_on = [aws_api_gateway_stage.mint_creator_nft_stage]
  api_stages {
    api_id = aws_api_gateway_rest_api.mint_creator_nft_api.id
    stage  = "${local.network}-creator-nft"
  }

  name = "Freshdesk Webhook Client Usage Plan"

  quota_settings {
    limit  = "100"
    offset = "0"
    period = "DAY"
  }

  throttle_settings {
    burst_limit = "60"
    rate_limit  = "30"
  }
}

resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.freshdesk_api_key_name.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.client_usage_plan.id
}

resource "aws_api_gateway_integration" "mint_creator_nft_api_integration" {
  cache_namespace         = aws_api_gateway_rest_api.mint_creator_nft_api.root_resource_id
  connection_type         = "INTERNET"
  content_handling        = "CONVERT_TO_TEXT"
  http_method             = "POST"
  integration_http_method = "POST"
  passthrough_behavior    = "WHEN_NO_MATCH"
  resource_id             = aws_api_gateway_rest_api.mint_creator_nft_api.root_resource_id
  rest_api_id             = aws_api_gateway_rest_api.mint_creator_nft_api.id
  timeout_milliseconds    = "29000"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.mint_creator_nft_function.invoke_arn
}

resource "aws_api_gateway_integration_response" "mint_creator_nft_api_integration_resp" {
  depends_on = [aws_api_gateway_integration.mint_creator_nft_api_integration]
  http_method = "POST"
  resource_id = aws_api_gateway_rest_api.mint_creator_nft_api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.mint_creator_nft_api.id
  status_code = "200"
}
