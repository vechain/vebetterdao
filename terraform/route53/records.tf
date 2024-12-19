# DNS A Record for vebetterdao.org pointing to IP addresses
resource "aws_route53_record" "vebetterdao_org_a" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "vebetterdao.org"
  type    = "A"
  ttl     = 300
  records = ["35.71.142.77", "52.223.52.2"]
}

# DNS NS Record for vebetterdao.org with nameservers
resource "aws_route53_record" "vebetterdao_org_ns" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "vebetterdao.org"
  type    = "NS"
  ttl     = 300
  records = [
    "ns-1091.awsdns-08.org.",
    "ns-1940.awsdns-50.co.uk.",
    "ns-489.awsdns-61.com.",
    "ns-913.awsdns-50.net."
  ]
}

# CNAME Record for mainnet.live pointing to ALB
resource "aws_route53_record" "mainnet_live" {
  zone_id = module.b3tr_vechain_zone.public_zone_id
  name    = "mainnet.live.b3tr.vechain.org"
  type    = "CNAME"
  ttl     = 300
  records = ["green-main-api-b3tr-alb-1559474217.eu-west-1.elb.amazonaws.com"]
}

# CNAME Record for testnet.live pointing to ALB
resource "aws_route53_record" "testnet_live" {
  zone_id = module.b3tr_vechain_zone.public_zone_id
  name    = "testnet.live.b3tr.vechain.org"
  type    = "CNAME"
  ttl     = 300
  records = ["green-test-api-b3tr-alb-101845078.eu-west-1.elb.amazonaws.com"]
}

# Service Discovery Records for API endpoints
resource "aws_route53_record" "service_discovery_records" {
  for_each = {
    "main-api" = "blue-main-api-b3tr-alb-53924463.eu-west-1.elb.amazonaws.com"
    "test-api" = "blue-test-api-b3tr-alb-109727172.eu-west-1.elb.amazonaws.com"
  }

  zone_id = module.b3tr_blue_zone.private_zone_id
  name    = each.key
  type    = "A"

  alias {
    name                   = each.value
    zone_id                = data.aws_lb_hosted_zone_id.current.id
    evaluate_target_health = true
  }
}

# DNS TXT Record for vebetterdao.org
resource "aws_route53_record" "vebetterdao_org_txt" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "vebetterdao.org"
  type    = "TXT"
  ttl     = 60
  records = ["google-site-verification=mpFDV_wgT2zoCcAP-Lhbw9VG87_1UfUPhvGYODacaqk"]
}

# CNAME Record for www.vebetterdao.org
resource "aws_route53_record" "www_vebetterdao_org" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "www.vebetterdao.org"
  type    = "CNAME"
  ttl     = 300
  records = ["vebetterdao.org"]
}

# CNAME Record for docs.vebetterdao.org
resource "aws_route53_record" "docs_vebetterdao_org" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "docs.vebetterdao.org"
  type    = "CNAME"
  ttl     = 60
  records = ["143e8c3363-hosting.gitbook.io"]
}

# CNAME Record for governance.vebetterdao.org
resource "aws_route53_record" "governance_vebetterdao_org" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "governance.vebetterdao.org"
  type    = "CNAME"
  ttl     = 300
  records = ["cname.vercel-dns.com"]
}

# CNAME Record for dev.testnet.governance.vebetterdao.org
resource "aws_route53_record" "dev_testnet_governance_vebetterdao_org" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "dev.testnet.governance.vebetterdao.org"
  type    = "CNAME"
  ttl     = 300
  records = ["cname.vercel-dns.com"]
}

# A Record for www.connect.vebetterdao.org
resource "aws_route53_record" "www_connect_vebetterdao_org" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "www.connect.vebetterdao.org"
  type    = "A"
  
  alias {
    name                   = "d27haz8ccqrb4e.cloudfront.net"
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

# A Record for connect.vebetterdao.org
resource "aws_route53_record" "connect_vebetterdao_org" {
  zone_id = module.vebetterdao_zone.public_zone_id
  name    = "connect.vebetterdao.org"
  type    = "A"
  
  alias {
    name                   = "d27haz8ccqrb4e.cloudfront.net"
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}
