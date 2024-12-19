data "aws_route53_zone" "vebetterdao_zone" {
  zone_id = "Z021131723MSK7QB4PZ73"
}

locals {
  route53_records = yamldecode(file("${path.module}/route53_records.yaml"))
}

resource "aws_route53_record" "dns_records" {
  for_each = { for record in local.route53_records.records : "${record.name}_${record.type}" => record }

  zone_id = data.aws_route53_zone.vebetterdao_zone.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = try(each.value.ttl, null)
  records = try(each.value.records, null)

  dynamic "alias" {
    for_each = try(each.value.alias_target, null) != null ? [1] : []
    content {
      name                   = each.value.alias_target.dns_name
      zone_id                = each.value.alias_target.zone_id
      evaluate_target_health = each.value.alias_target.evaluate_target_health
    }
  }
}
