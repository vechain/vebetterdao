## ecr creation
module "ecr" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//ecr?ref=Fix-max-image-count-ECR-lifecycle-policy"
  #ecr_name             = var.ecr_names
  project  = local.config.project
  env      = local.env
  app_name = "thor-solo"
}
