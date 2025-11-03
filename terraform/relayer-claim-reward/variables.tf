variable "MAINNET_MNEMONIC" {
  description = "Mnemonic for mainnet contracts"
  type        = string
  sensitive   = true
  default     = ""
}

variable "TESTNET_MNEMONIC" {
  description = "Mnemonic for testnet contracts"
  type        = string
  sensitive   = true
  default     = ""
}

