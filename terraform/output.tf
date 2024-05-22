output "thor-solo-node" {
  value = module.ecs-lb-service-thor-solo.service_name
}

output "thor-solo-cluster" {
  value = module.ecs-cluster.name
}

output "thor-solo-domain" {
  value = local.domains[0].name
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
