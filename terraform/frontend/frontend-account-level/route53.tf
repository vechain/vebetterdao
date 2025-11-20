################################################################################
# Hosted Zone & DNS Record creation
################################################################################
resource "aws_route53_zone" "governance_public_zone_dev" {
  name  = local.env.hosted_zone_name
}
