variable "next_public_env_vars" {
  description = "Map of NEXT_PUBLIC_* runtime env vars sourced from the target GitHub environment's vars.NEXT_PUBLIC_*. Merged into App Runner runtime_environment_variables. Excludes NEXT_PUBLIC_APP_ENV (declared inline in the env yaml) and NEXT_PUBLIC_APP_VERSION (derived from image_tag)."
  type        = map(string)
  default     = {}
}
