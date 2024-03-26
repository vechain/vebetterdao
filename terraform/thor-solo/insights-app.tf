module "insights_app" {
  source = "git@github.com:vechainfoundation/terraform_infrastructure_modules.git//s3-cloudfront-hosting?ref=main"

  env           = local.env
  origin_id     = "${local.domains[1].name}_origin_id"
  bucket_prefix = "${local.env}-${local.config.project}-insights"
  domain_name   = local.domains[1].name
  domain_zone   = local.domains[0].zone
  project       = local.config.project
}
