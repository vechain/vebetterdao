################################################################################
# Route53 DNS Records (optional)
################################################################################

locals {
  manage_dns = local.custom_domain_enabled && lookup(local.env, "manage_dns_records", false)
}

data "aws_apprunner_hosted_zone_id" "main" {
  count = local.custom_domain_enabled ? 1 : 0
}

data "aws_route53_zone" "custom_domain" {
  count        = local.manage_dns && lookup(local.env, "route53_zone_name", null) != null ? 1 : 0
  name         = lookup(local.env, "route53_zone_name", null)
  private_zone = false
}

resource "aws_route53_record" "custom_domain" {
  count = local.manage_dns ? 1 : 0

  zone_id = coalesce(
    lookup(local.env, "route53_zone_id", null),
    try(data.aws_route53_zone.custom_domain[0].zone_id, null)
  )
  name = local.env.domain
  type = "A"

    alias {
    name                   = aws_apprunner_service.frontend.service_url
    zone_id                = data.aws_apprunner_hosted_zone_id.main[0].id
        evaluate_target_health = true
    }

    depends_on = [aws_apprunner_service.frontend]
}
