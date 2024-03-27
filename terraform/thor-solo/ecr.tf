## ecr creation
module "ecr" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//ecr?ref=main"
  #ecr_name             = var.ecr_names
  project  = local.config.project
  env      = local.env
  app_name = "thor-solo"
}
