resource "aws_lambda_function" "mint_creator_nft_function" {
  architectures = ["x86_64"]
  filename = "../packages/lambda/dist/staging/mintCreatorNFT/index.zip"
  source_code_hash = filebase64sha256("../packages/lambda/dist/staging/mintCreatorNFT/index.zip")

  ephemeral_storage {
    size = "512"
  }

  function_name = "mint-creator-nft-${local.config.network}"
  handler       = "index.handler"

  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/mint-creator-nft-${local.config.network}"
  }

  memory_size                    = "128"
  package_type                   = "Zip"
  reserved_concurrent_executions = "-1"
  role                           = aws_iam_role.mint_creator_nft_role.arn
  runtime                        = "nodejs20.x"
  skip_destroy                   = "false"
  timeout                        = "75"

  tracing_config {
    mode = "PassThrough"
  }
}

resource "aws_iam_role" "mint_creator_nft_role" {
  name = "mint-creator-nft-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  max_session_duration = "3600"
  path                 = "/"
}

data "aws_iam_policy_document" "function_logging_policy" {
  statement {
    effect    = "Allow"
    actions = [
      "logs:PutLogEvents",
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
      "logs:StartQuery"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "function_logging_policy" {
  name        = "MintCreatorNFTFunctionLoggingPolicy"
  description = "A test policy"
  policy      = data.aws_iam_policy_document.function_logging_policy.json
}

resource "aws_iam_role_policy_attachment" "function_logging_policy_attachment" {
  role       = aws_iam_role.mint_creator_nft_role.name
  policy_arn = aws_iam_policy.function_logging_policy.arn
}

resource "aws_iam_role_policy_attachment" "secrets_manager_policy_attachment" {
  role       = aws_iam_role.mint_creator_nft_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}