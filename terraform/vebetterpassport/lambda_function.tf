resource "aws_lambda_function" "resetUserSignalsWithReason_vebetterpassport" {
  architectures = ["x86_64"]

  ephemeral_storage {
    size = "512"
  }

  function_name = "resetUserSignalsWithReason_vebetterpassport_${local.network}"
  handler       = "index.handler"
  filename      = "api/lambda/function.zip"

  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/resetUserSignalsWithReason_vebetterpassport_${local.network}"
  }

  memory_size                    = "128"
  package_type                   = "Zip"
  reserved_concurrent_executions = "-1"
  role                           = aws_iam_role.lambda_execution_role.arn
  runtime                        = "nodejs20.x"
  skip_destroy                   = "false"
  source_code_hash               = "Lki4MhQUpJFfcKWF1DnTtmFkhtU76x17BaOmdlhhx9E="
  timeout                        = "30"

  tracing_config {
    mode = "PassThrough"
  }

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      publish,
      tags,
      tags_all
    ]
  }
}

# terraform import aws_lambda_function.resetUserSignalsWithReason_vebetterpassport resetUserSignalsWithReason_vebetterpassport_testnet

