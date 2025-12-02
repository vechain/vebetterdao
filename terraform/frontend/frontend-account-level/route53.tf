################################################################################
# Hosted Zone & DNS Record creation
################################################################################

resource "aws_route53_zone" "governance_public_zone" {
  for_each = local.env.hosted_zones_and_certificates
  name     = each.value.zone_name
  
  tags = merge(local.default_tags, {
    Name = each.value.zone_name
  })
}

# Add the dev zone NS records to the prod zone so only the root domain needs registering in root account
locals {
  dev_governance_public_zone_name_servers = local.env.environment == "prod" ? {
    "testnet.governance.vebetterdao.org" = [
      "ns-1043.awsdns-02.org",
      "ns-2028.awsdns-61.co.uk",
      "ns-89.awsdns-11.com",
      "ns-941.awsdns-53.net",
    ]
    "beta.governance.vebetterdao.org" = [
      "ns-1529.awsdns-63.org",
      "ns-171.awsdns-21.com",
      "ns-1825.awsdns-36.co.uk",
      "ns-678.awsdns-20.net",
    ]
  } : {}
}

resource "aws_route53_record" "governance_public_zone_ns_records" {
  for_each = local.dev_governance_public_zone_name_servers
  zone_id  = aws_route53_zone.governance_public_zone["${local.env.environment}"].zone_id
  name     = each.key
  type     = "NS"
  ttl      = 300
  records  = each.value
}
