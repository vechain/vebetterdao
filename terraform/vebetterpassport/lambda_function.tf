resource "aws_lambda_function" "resetUserSignalsWithReason_vebetterpassport" {
  architectures = ["x86_64"]

  ephemeral_storage {
    size = "512"
  }

  function_name = "resetUserSignalsWithReason_vebetterpassport_${terraform.workspace == "dev" ? "testnet" : "mainnet"}"
  handler       = "index.handler"
  filename      = "api/lambda/function.zip"

  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/resetUserSignalsWithReason_vebetterpassport_${terraform.workspace == "dev" ? "testnet" : "mainnet"}"
  }

  memory_size                    = "128"
  package_type                   = "Zip"
  reserved_concurrent_executions = "-1"
  role                           = "arn:aws:iam::211125319139:role/b3tr-discord-bot-lambda"
  runtime                        = "nodejs20.x"
  skip_destroy                   = "false"
  source_code_hash               = "Lki4MhQUpJFfcKWF1DnTtmFkhtU76x17BaOmdlhhx9E="
  timeout                        = "30"

  tracing_config {
    mode = "PassThrough"
  }
}
# Lambda Permission
resource "aws_lambda_permission" "resetUserSignalsWithReason_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resetUserSignalsWithReason_vebetterpassport.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-1:211125319139:m0xna6yoc6/*/POST/reset-user-signal-count"
  statement_id  = "9c3f9a68-fd08-5d03-8fd9-5519252f4aaa"
}

# terraform import aws_lambda_function.resetUserSignalsWithReason_vebetterpassport resetUserSignalsWithReason_vebetterpassport_testnet
# terraform import aws_lambda_permission.resetUserSignalsWithReason_permission resetUserSignalsWithReason_vebetterpassport_testnet/9c3f9a68-fd08-5d03-8fd9-5519252f4aaa

