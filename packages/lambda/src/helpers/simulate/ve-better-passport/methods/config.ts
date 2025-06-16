import path from "path"
import dotenv from "dotenv"

import { mnemonic } from "@vechain/sdk-core"

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

  const walletAddress = mnemonic.deriveAddress(PHRASE, "0")
  const privateKey = mnemonic.derivePrivateKey(PHRASE, "0").toString("hex")

  return { walletAddress, privateKey }
}
