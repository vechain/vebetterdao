# Conditionally determine which secret to fetch based on environment
locals {
  secret_name = terraform.workspace == "prod" ? "vebetterpassport_reset_signal_mainnet" : "vebetterpassport_reset_signal_testnet"
}

# Data resource to fetch the secret containing multiple keys
data "aws_secretsmanager_secret" "vebetterpassport_secret" {
  name      = local.secret_name
}

data "aws_secretsmanager_secret_version" "vebetterpassport_secret" {
  secret_id = data.aws_secretsmanager_secret.vebetterpassport_secret.id
}
