################################################################################
# Route53 DNS Records (optional)
################################################################################

data "aws_apprunner_hosted_zone_id" "main" {
  count = local.custom_domain_enabled ? 1 : 0
}

data "aws_route53_zone" "custom_domain" {
  name         = lookup(local.env, "route53_zone_name", null)
  private_zone = false
}

resource "aws_route53_record" "custom_domain" {
  count = local.env.enable_custom_domain ? 1 : 0

  zone_id = data.aws_route53_zone.custom_domain.zone_id
  name = local.env.domain
  type = "A"
    alias {
    name                   = aws_apprunner_service.frontend.service_url
    zone_id                = data.aws_apprunner_hosted_zone_id.main[0].id
        evaluate_target_health = true
    }

    depends_on = [aws_apprunner_service.frontend]
}

resource "aws_route53_record" "validation_records" {
  count = length([local.env.domain]) + 1
  name = tolist(aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records)[count.index].name
  type = tolist(aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records)[count.index].type
  records = [tolist(aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records)[count.index].value]
  ttl = 30
  zone_id = data.aws_route53_zone.custom_domain.zone_id
}
