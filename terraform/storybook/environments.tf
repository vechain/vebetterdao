# Pull in workspace-specific environment settings from YAML file under environments directory
# Can then be used as local.env.<key> in other files
locals {
  env = merge(yamldecode(file("environments/${terraform.workspace}/${terraform.workspace}.yaml")))
}

