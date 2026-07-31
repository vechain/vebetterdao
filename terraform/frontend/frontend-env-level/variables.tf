variable "next_public_env_vars" {
  description = "Map of NEXT_PUBLIC_* runtime env vars sourced from the target GitHub environment's vars.NEXT_PUBLIC_*. Merged into App Runner runtime_environment_variables. Excludes NEXT_PUBLIC_APP_ENV (declared inline in the env yaml) and NEXT_PUBLIC_APP_VERSION (forwarded via var.app_version)."
  type        = map(string)
  default     = {}
}

variable "app_version" {
  description = "Semantic version tag (e.g. v.1.32.0) used to populate NEXT_PUBLIC_APP_VERSION. Falls back to image_tag (SHA) when empty — break-glass deploys off a non-tag ref."
  type        = string
  default     = ""
}
