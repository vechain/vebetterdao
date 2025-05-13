import path from "path"
import dotenv from "dotenv"
import { FunctionFragment } from "ethers"

import { HttpClient, ThorClient } from "@vechain/sdk-network"
import { clauseBuilder, mnemonic } from "@vechain/sdk-core"

import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import localConfig from "@repo/config/local"
import { getConfig } from "@repo/config"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })

const NODE_URL = getConfig("local").nodeUrl

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = (): { walletAddress: string; privateKey: string } => {
  const PHRASE = process.env.MNEMONIC?.split(" ")
  if (!PHRASE) {
    throw new Error("Mnemonic not found")
  }

  const walletAddress = mnemonic.deriveAddress(PHRASE, "0")
  const privateKey = mnemonic.derivePrivateKey(PHRASE, "0").toString("hex")

  return { walletAddress, privateKey }
}

/**
 * Resets the signal counter for a banned wallet with a given reason.
 * @param bannedWallet - The address of the wallet to reset the signal counter for.
 * @param reason - The reason for resetting the signal counter.
 * @returns An object containing the transaction receipt and gas result.
 */
const resetSignalCounter = async (thor: ThorClient, bannedWallet: string, reason: string) => {
  const { walletAddress, privateKey } = getCallerWalletInfo()

  const clause = clauseBuilder.functionInteraction(
    localConfig.veBetterPassportContractAddress,
    VeBetterPassport__factory.createInterface().getFunction("resetUserSignalsWithReason") as FunctionFragment,
    [bannedWallet, reason],
  )

  const gasResult = await thor.gas.estimateGas([clause], walletAddress)
  if (gasResult.reverted) {
    console.error("Txn (Gas) reverted:", gasResult.revertReasons, gasResult.vmErrors)
    throw new Error(`Txn (Gas) reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }

  const txBody = await thor.transactions.buildTransactionBody([clause], gasResult.totalGas)
  const signedTx = await thor.transactions.signTransaction(txBody, privateKey)
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}

// Main execution function with error handling
const main = async () => {
  try {
    const thor = new ThorClient(new HttpClient(NODE_URL), { isPollingEnabled: false })

    const bannedWallet = "0x0000000000000000000000000000000000000000"
    const reason = "From script: reseting user signal counter"
    const result = await resetSignalCounter(thor, bannedWallet, reason)
    console.log("Signal counter reset successfully:", result)
  } catch (error) {
    console.error("Error executing reset signal counter:", error)
    throw error
  }
}

// Execute main function if this script is run directly
if (require.main === module) {
  main()
    .then(() => console.log("Process completed successfully"))
    .catch(error => {
      console.error("Process failed:", error)
      process.exit(1)
    })
}

// Export for external use
export { resetSignalCounter, main }
