## ecr creation
module "ecr" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//ecr?ref=6bd2e52" # v.2.0.4
  project  = local.config.project
  env      = local.env
  app_name = "thor-solo"

  enable = true
  enable_scan_configuration = true
  image_tag_mutability = "MUTABLE"
}
