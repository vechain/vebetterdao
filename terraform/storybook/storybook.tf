# B3TR Storybook - S3 and CloudFront Hosting Configuration
#
# This module creates:
# - S3 bucket for static website hosting
# - CloudFront distribution for CDN
# - ACM certificate for HTTPS
# - Route53 records for the domain

data "aws_route53_zone" "b3tr_domain_zone" {
  name = local.env.base_domain
}

module "storybook" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//s3-cloudfront-hosting?ref=v.3.1.23"

  env           = local.env.environment
  project       = local.env.project
  origin_id     = "${local.env.domain}_origin_id"
  bucket_prefix = "${local.env.environment}-${local.env.project}-storybook"
  domain_name   = local.env.domain
  domain_zone   = data.aws_route53_zone.b3tr_domain_zone.zone_id

  # Enable gzip compression for better performance
  compress = true

  # Don't create www subdomain
  create_cname_www = false
  create_alias_www = false
}

