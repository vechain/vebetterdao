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
