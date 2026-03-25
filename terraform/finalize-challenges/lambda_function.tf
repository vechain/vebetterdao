data "archive_file" "lambda_zip" {
  type             = "zip"
  output_file_mode = "0666"
  source_dir       = "${path.module}/../../${local.config.lambda_source_dir}"
  output_path      = "${path.module}/../../${local.config.lambda_source_dir}/index.zip"
  excludes         = ["index.zip"]
}

resource "aws_lambda_function" "finalize_challenges" {
  architectures = ["x86_64"]

  function_name    = local.config.lambda_function_name
  handler          = local.config.lambda_handler
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  lifecycle {
    precondition {
      condition     = fileexists("${path.module}/../../${local.config.lambda_source_dir}/index.zip")
      error_message = "Lambda build does not exist. Please run the build script first."
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/finalize-challenges"
  }

  memory_size                    = local.config.lambda_memory_size
  package_type                   = "Zip"
  reserved_concurrent_executions = "-1"
  role                           = aws_iam_role.scheduler_lambda_execution_role.arn
  runtime                        = local.config.lambda_runtime
  skip_destroy                   = "false"
  timeout                        = local.config.lambda_timeout

  tracing_config {
    mode = "PassThrough"
  }

  tags = {
    Environment = local.network
    ManagedBy   = "terraform"
    Project     = "finalize-challenges"
  }
}
