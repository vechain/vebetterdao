################################################################################
# Outputs
################################################################################

output "service_id" {
  description = "ID of the App Runner service"
  value       = aws_apprunner_service.frontend.service_id
}

output "service_arn" {
  description = "ARN of the App Runner service"
  value       = aws_apprunner_service.frontend.arn
}

output "service_url" {
  description = "Default App Runner service URL"
  value       = "https://${aws_apprunner_service.frontend.service_url}"
}

output "custom_domain_url" {
  description = "Custom domain URL (if configured)"
  value       = local.custom_domain_enabled ? "https://${local.env.domain}" : "https://${aws_apprunner_service.frontend.service_url}"
}

output "custom_domain_status" {
  description = "Status of custom domain association"
  value       = local.custom_domain_enabled ? try(aws_apprunner_custom_domain_association.frontend[0].status, "not_configured") : "disabled"
}

output "custom_domain_validation_records" {
  description = "Validation records required for the custom domain (if DNS is managed elsewhere)"
  value       = local.custom_domain_enabled ? try(aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records, []) : []
  sensitive   = false
}

output "environment" {
  description = "Environment name"
  value       = local.env.environment
}

output "status" {
  description = "Current status of the App Runner service"
  value       = aws_apprunner_service.frontend.status
}

