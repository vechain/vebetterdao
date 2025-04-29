# Get AWS account information
# data "aws_caller_identity" "current" {}
# data "aws_region" "current" {}
# data "aws_partition" "current" {}

# # Build Lambda code using local-exec
# resource "terraform_data" "esbuild_lambdas_v2" {
#   triggers_replace = timestamp()

#   provisioner "local-exec" {
#     interpreter = ["/bin/bash"]
#     working_dir = "${path.module}/../.."
#     command     = "./api/src/build.sh"
#   }

#   input = "${path.module}/../../dist"
# }

# Package Lambda code directly from source
data "archive_file" "vebetterpassport_lambda" {
  type             = "zip"
  output_file_mode = "0666"
  source_dir       = "${path.module}/../../api/src/vebetterpassport"
  output_path      = "${path.module}/function.zip"
}

# Lambda Function
resource "aws_lambda_function" "resetUserSignalsWithReason_vebetterpassport" {
  architectures = ["x86_64"]

  function_name = local.config.lambda_function_name
  handler       = local.config.lambda_handler
  filename      = data.archive_file.vebetterpassport_lambda.output_path
  source_code_hash = data.archive_file.vebetterpassport_lambda.output_base64sha256
  
  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/${local.config.lambda_function_name}"
  }

  memory_size                    = local.config.lambda_memory_size
  package_type                   = "Zip"
  reserved_concurrent_executions = "-1"
  role                           = aws_iam_role.lambda_execution_role.arn
  runtime                        = local.config.lambda_runtime
  timeout                        = local.config.lambda_timeout

  # Match existing deployment if source code hash matches
  lifecycle {
    ignore_changes = [
      tags,
      tags_all
    ]
  }
}

# Lambda Permission
resource "aws_lambda_permission" "resetUserSignalsWithReason_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resetUserSignalsWithReason_vebetterpassport.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-1:${local.account_id}:${aws_api_gateway_rest_api.reset_user_signals_api.id}/*/POST/reset-user-signal-count"
  statement_id  = "api-gateway-invoke-${local.network}"
} 