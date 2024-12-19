# Zone definitions
module "vebetterdao_zone" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//route53"

  public_zone_name = "vebetterdao.org"
  domain_name      = "vebetterdao.org"
  project          = local.config.project
  env              = local.env
}
