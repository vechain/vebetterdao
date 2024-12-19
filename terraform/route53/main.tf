# Zone definitions
module "vebetterdao_zone" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//route53"

  public_zone_name = "vebetterdao.org"
  domain_name      = "vebetterdao.org"
  project          = local.config.project
  env              = local.env
}

module "b3tr_blue_zone" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//route53"

  private_zone_name = "b3tr-blue"
  domain_name      = "b3tr-blue"
  project          = local.config.project
  env              = local.env
  vpc_id           = "vpc-08f412b3c4cfff620"
}

module "b3tr_green_zone" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//route53"

  private_zone_name = "b3tr-green"
  domain_name      = "b3tr-green"
  project          = local.config.project
  env              = local.env
  vpc_id           = "vpc-08f412b3c4cfff620"
}

module "b3tr_vechain_zone" {
  source = "git@github.com:vechain/terraform_infrastructure_modules.git//route53"

  public_zone_name = "b3tr.vechain.org"
  domain_name      = "b3tr.vechain.org"
  project          = local.config.project
  env              = "prod"
  create_cert      = true
} 