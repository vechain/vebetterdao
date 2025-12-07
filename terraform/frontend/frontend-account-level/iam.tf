################################################################################
# IAM Roles for App Runner
################################################################################

locals {
  instance_role_name = "${local.env.project_name}-${local.env.environment}-apprunner-instance"
  access_role_name   = "${local.env.project_name}-${local.env.environment}-apprunner-access"
}

resource "aws_iam_role" "app_runner_instance_role" {
  name = local.instance_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.default_tags, {
    Name = local.instance_role_name
  })
}

# Policy for accessing SSM Parameters
resource "aws_iam_role_policy" "ssm_access" {
  name = "ssm-access"
  role = aws_iam_role.app_runner_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = [
          "arn:aws:ssm:*:*:parameter/b3tr/frontend/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          "arn:aws:kms:*:*:key/*" # In a real scenario, we should restrict this to the specific KMS key used for SSM
        ]
      }
    ]
  })
}

resource "aws_iam_role" "app_runner_access_role" {
  name = local.access_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.default_tags, {
    Name = local.access_role_name
  })
}

resource "aws_iam_role_policy_attachment" "app_runner_ecr_access" {
  role       = aws_iam_role.app_runner_access_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}