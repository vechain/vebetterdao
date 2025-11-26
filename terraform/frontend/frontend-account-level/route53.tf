################################################################################
# Hosted Zone & DNS Record creation
################################################################################
resource "aws_route53_zone" "governance_public_zone_dev" {
  for_each = local.env.hosted_zone_names
  name  = each.value
}
