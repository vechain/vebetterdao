################################################################################
# ACM Certificates
################################################################################

# Flatten the certificates configuration into a map for iteration
locals {
  certificates = merge([
    for zone_key, zone_config in local.env.hosted_zones_and_certificates : {
      for cert_name in zone_config.certificate_names : cert_name => {
        zone_key    = zone_key
        zone_name   = zone_config.zone_name
        domain_name = cert_name
      }
    }
  ]...)
}

# Create a certificate for each domain
# Each certificate includes a wildcard SAN for preview environments
resource "aws_acm_certificate" "cert" {
  for_each          = local.certificates
  domain_name       = each.value.domain_name
  validation_method = "DNS"
  
  # Add wildcard SAN for preview subdomains
  subject_alternative_names = local.env.environment != "prod" ? [
    "*.${each.value.domain_name}",
  ] : []
  
  lifecycle {
    create_before_destroy = true
  }
}

# DNS Validation Records
# Use the certificate key (domain name) as the for_each key since it's known at plan time
# The wildcard and root domain share the same validation record, so we only need one per cert
resource "aws_route53_record" "cert_validation" {
  for_each = local.certificates

  allow_overwrite = true
  name            = tolist(aws_acm_certificate.cert[each.key].domain_validation_options)[0].resource_record_name
  records         = [tolist(aws_acm_certificate.cert[each.key].domain_validation_options)[0].resource_record_value]
  ttl             = 60
  type            = tolist(aws_acm_certificate.cert[each.key].domain_validation_options)[0].resource_record_type
  zone_id         = aws_route53_zone.governance_public_zone[each.value.zone_key].zone_id
}

# Certificate Validation
resource "aws_acm_certificate_validation" "cert" {
  for_each        = aws_acm_certificate.cert
  certificate_arn = each.value.arn
  validation_record_fqdns = [aws_route53_record.cert_validation[each.key].fqdn]
}
