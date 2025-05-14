/* Removed IAM role creation as we're using the existing b3tr-discord-bot-lambda role */

# Create Lambda execution role with the same permissions as b3tr-discord-bot-lambda
resource "aws_iam_role" "lambda_execution_role" {
  name = "b3tr-vebetterpassport-${local.network}-lambda"

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

  # Prevent replacement when updating
  lifecycle {
    create_before_destroy = true
  }
}

# Attach AWSLambdaBasicExecutionRole policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# SecretsManager policy with detailed permissions
resource "aws_iam_policy" "secrets_manager_policy" {
  name        = "b3tr-vebetterpassport-secrets-manager-${local.network}"
  description = "IAM policy for SecretsManager access"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "BasePermissions",
        Effect = "Allow",
        Action = [
          "secretsmanager:*",
          "cloudformation:CreateChangeSet",
          "cloudformation:DescribeChangeSet",
          "cloudformation:DescribeStackResource",
          "cloudformation:DescribeStacks",
          "cloudformation:ExecuteChangeSet",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "kms:DescribeKey",
          "kms:ListAliases",
          "kms:ListKeys",
          "lambda:ListFunctions",
          "tag:GetResources"
        ],
        Resource = "*"
      },
      {
        Sid    = "LambdaPermissions",
        Effect = "Allow",
        Action = [
          "lambda:AddPermission",
          "lambda:CreateFunction",
          "lambda:GetFunction",
          "lambda:InvokeFunction",
          "lambda:UpdateFunctionConfiguration"
        ],
        Resource = "arn:aws:lambda:*:*:function:SecretsManager*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secrets_manager" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.secrets_manager_policy.arn
} 