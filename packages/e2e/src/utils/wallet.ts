import { HDNodeWallet, Mnemonic } from "ethers"

import { walletMnemonic } from "../config"

const VET_DERIVATION_PATH = "m/44'/818'/0'/0/0"

let cached: string | null = null

/**
 * First account address derived from the e2e mnemonic.
 * This is the account VeWorld uses for signing in tests, and also the deploy admin
 * (since the e2e Hardhat deploy uses MNEMONIC = e2e wallet mnemonic).
 */
export const getTestWalletAddress = (): string => {
  if (cached) return cached
  const wallet = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(walletMnemonic), VET_DERIVATION_PATH)
  cached = wallet.address.toLowerCase()
  return cached
}
