variable "runtime_platform" {
  type = list(object({
    operating_system_family = string
    cpu_architecture        = string
  }))
  default = [{
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }]
}

variable "domain_name_data" {
  default = {
    "dev" = {
      suffix  = "dev.b3tr.vechain.org"
      zone_id = "Z09214252JN9OW8DF7KO4"

    }
  }
}

variable "ecr_names" {
  default = ["thor-solo"]
}
