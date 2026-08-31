import path from "path"
import dotenv from "dotenv"

import { Address, HDKey } from "@vechain/sdk-core"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
export const getCallerWalletInfo = (): { walletAddress: string; privateKey: string } => {
  const PHRASE = process.env.MNEMONIC?.split(" ")
  if (!PHRASE) {
    throw new Error("Mnemonic not found")
  }

  const child = HDKey.fromMnemonic(PHRASE).deriveChild(0)
  if (!child.privateKey) {
    throw new Error("Private key not found")
  }

  return {
    walletAddress: Address.ofPrivateKey(child.privateKey).toString(),
    privateKey: Buffer.from(child.privateKey).toString("hex"),
  }
}
