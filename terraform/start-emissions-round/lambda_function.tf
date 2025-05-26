data "archive_file" "lambda_zip" {
  type             = "zip"
  output_file_mode = "0666"
  source_dir      = "${path.module}/../../${local.config.lambda_source_dir}"
  output_path      = "${path.module}/../../${local.config.lambda_source_dir}/index.zip"
  excludes         = ["index.zip"]
}

resource "aws_lambda_function" "start_emissions_round" {
  architectures = ["x86_64"]

  ephemeral_storage {
    size = "512"
  }

  function_name = "arn:aws:lambda:${local.config.aws_region}:${local.config.aws_account_id}:function:start-emissions-round"
  handler       = "index.handler"

  filename      = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  lifecycle {
    precondition {
      condition     = fileexists("${path.module}/../../${local.config.lambda_source_dir}/index.zip")
      error_message = "Lambda build does not exist. Please run the build script first."
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/start-emissions-round"
  }

  memory_size                    = "128"
  package_type                   = "Zip"
  reserved_concurrent_executions = "-1"
  role                           = aws_iam_role.scheduler_lambda_execution_role.arn
  runtime                        = "nodejs20.x"
  skip_destroy                   = "false"
  timeout                        = "900"

  tracing_config {
    mode = "PassThrough"
  }

  tags = {
    Environment = local.network
    ManagedBy   = "terraform"
    Project     = "start-emissions-round"
  }
} 