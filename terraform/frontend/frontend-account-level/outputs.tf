################################################################################
# Outputs
################################################################################

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.frontend.name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.frontend.arn
}

output "app_runner_instance_role_arn" {
  description = "ARN of the App Runner instance role"
  value       = aws_iam_role.app_runner_instance_role.arn
}

output "app_runner_access_role_arn" {
  description = "ARN of the App Runner access role for ECR"
  value       = aws_iam_role.app_runner_access_role.arn
}

output "environment_metadata" {
  description = "Metadata useful for downstream stacks"
  value = {
    project_name = local.env.project_name
    environment  = local.env.environment
    account_id   = local.env.account_id
    region       = local.env.region
  }
}
