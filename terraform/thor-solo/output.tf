output "thor-solo-node" {
  value = module.thor_solo_node.service_name
}

output "thor-solo-cluster" {
  value = module.thor_solo_node.cluster_name
}

output "thor-solo-domain" {
  value = module.thor-solo_domain.route53_name
}

output "ecr_name" {
  value = module.ecr.registry_id
}

output "insight_domain" {
  value = module.insight.domain_alias
}

output "inspector_domain" {
  value = module.inspector.domain_alias
}
