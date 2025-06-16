
# Data resource to fetch the secret containing multiple keys
data "aws_secretsmanager_secret" "vebetterpassport_secret" {
  name = local.secret_name
}

data "aws_secretsmanager_secret_version" "vebetterpassport_secret" {
  secret_id = data.aws_secretsmanager_secret.vebetterpassport_secret.id
}

# The secret contains multiple keys, extract all needed values
locals {
  secret_values = jsondecode(data.aws_secretsmanager_secret_version.vebetterpassport_secret.secret_string)
  minter_pk     = local.secret_values["RESET_SIGNALER_PK"]
  mnemonic      = local.secret_values["MNEMONIC"]
  wallet        = local.secret_values["WALLET"]
}

# Output the values to be used by the Lambda
output "minter_pk" {
  value     = local.minter_pk
  sensitive = true
}

output "mnemonic" {
  value     = local.mnemonic
  sensitive = true
}

output "wallet" {
  value     = local.wallet
  sensitive = true
}