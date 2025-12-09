# B3TR Storybook - Terraform Outputs
#
# These outputs are used by CI/CD workflows to deploy the storybook application.

output "cloudfront_distribution_domain" {
  description = "The CloudFront distribution domain name (e.g., d1234567890.cloudfront.net)"
  value       = module.storybook.cloudfront_domain
}

output "domain_alias" {
  description = "The Route53 domain alias for the storybook"
  value       = module.storybook.domain_alias
}

output "s3_website_endpoint" {
  description = "The S3 website endpoint"
  value       = module.storybook.s3_website_endpoint
}

output "environment" {
  description = "The current environment name"
  value       = local.env.environment
}

output "environment_domain" {
  description = "The full domain for this environment"
  value       = local.env.domain
}

output "zone_id" {
  description = "The Route53 zone ID for b3tr.vechain.org"
  value       = data.aws_route53_zone.b3tr_domain_zone.zone_id
}

