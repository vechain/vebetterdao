# Get AWS account information
# data "aws_caller_identity" "current" {}
# data "aws_region" "current" {}
# data "aws_partition" "current" {}

# Build Lambda code using local-exec
resource "terraform_data" "build_lambda" {
  triggers_replace = {
    # Use a timestamp to rebuild on every apply during development
    time = timestamp()
    # Add environment to trigger rebuilds when environment changes
    env = local.network
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    working_dir = "${path.module}/../../"
    # Run the build script from the project root with enhanced security for secrets
    command = <<-EOT
      set +x
      export TF_LOG=ERROR
      chmod +x build.sh && ./build.sh ${local.network}
    EOT
    environment = {
      MAINNET_MNEMONIC = sensitive(var.MAINNET_MNEMONIC)
      TESTNET_MNEMONIC = sensitive(var.TESTNET_MNEMONIC)
    }
  }
}

data "archive_file" "lambda_zip" {
  depends_on = [terraform_data.build_lambda]
  type        = "zip"
  output_file_mode = "0666"
  source_dir  = "${path.module}/../../${local.config.lambda_source_dir}"
  output_path = "${path.module}/../../${local.config.lambda_source_dir}/index.zip"
}

# Lambda Function
resource "aws_lambda_function" "resetUserSignalsWithReason_vebetterpassport" {
  architectures = ["x86_64"]
  depends_on    = [terraform_data.build_lambda]

  function_name = local.config.lambda_function_name
  handler       = local.config.lambda_handler
  filename      = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

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

  environment {
    variables = {
      RESET_SIGNALER_PK = local.minter_pk
      MNEMONIC          = local.mnemonic
      WALLET            = local.wallet
    }
  }

  # Match existing deployment if source code hash matches and ignore source_code_hash changes
  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
      last_modified
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