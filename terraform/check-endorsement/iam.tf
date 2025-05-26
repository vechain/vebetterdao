resource "aws_iam_role" "scheduler_lambda_execution_role" {
  name = "b3tr-check-endorsement-${terraform.workspace}-lambda"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = local.network
    ManagedBy   = "terraform"
    Project     = "check-endorsement"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.scheduler_lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "scheduler_eventbridge_lambda_basic" {
  role       = aws_iam_role.scheduler_eventbridge_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "scheduler_eventbridge_execution_role" {
  name = "b3tr-check-endorsement-${terraform.workspace}-eventbridge-scheduler"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "scheduler.amazonaws.com"
        },
        Action = "sts:AssumeRole",
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = {
    Environment = local.network
    ManagedBy   = "terraform"
    Project     = "check-endorsement"
  }
}

resource "aws_iam_role_policy_attachment" "scheduler_eventbridge_lambda_execute" {
  role       = aws_iam_role.scheduler_eventbridge_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSLambdaExecute"
}

resource "aws_iam_role_policy_attachment" "secrets_manager_access" {
  role       = aws_iam_role.scheduler_lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}


resource "aws_iam_role_policy_attachment" "scheduler_eventbridge_lambda_full_access" {
  role       = aws_iam_role.scheduler_eventbridge_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
}

resource "aws_iam_role_policy_attachment" "scheduler_eventbridge_lambda_basic_execution" {
  role       = aws_iam_role.scheduler_eventbridge_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
} 