## ecr creation
module "ecr" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//ecr?ref=v.1.0.21"
  #ecr_name             = var.ecr_names
  project  = local.config.project
  env      = local.env
  app_name = "thor-solo"
  image_tag_mutability = "MUTABLE"
}
