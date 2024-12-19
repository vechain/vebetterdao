# Service Discovery Records for API endpoints - Blue Environment
resource "aws_route53_record" "blue_service_discovery_records" {
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

# Service Discovery Records for API endpoints - Green Environment
resource "aws_route53_record" "green_service_discovery_records" {
  for_each = {
    "main-api" = "green-main-api-b3tr-alb-1559474217.eu-west-1.elb.amazonaws.com"
    "test-api" = "green-test-api-b3tr-alb-101845078.eu-west-1.elb.amazonaws.com"
  }

  zone_id = module.b3tr_green_zone.private_zone_id
  name    = each.key
  type    = "A"

  alias {
    name                   = each.value
    zone_id                = data.aws_lb_hosted_zone_id.current.id
    evaluate_target_health = true
  }
} 