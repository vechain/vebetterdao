import path from "path"
import dotenv from "dotenv"
import { FunctionFragment } from "ethers"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import { addressUtils, clauseBuilder, mnemonic } from "@vechain/sdk-core"

import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import localConfig from "@repo/config/local"
import { getConfig } from "@repo/config"

import { getSecret } from "../../helpers/secret"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })

const NODE_URL = getConfig("testnet").nodeUrl

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = async (): Promise<{ walletAddress: string; privateKey: string }> => {
  const client = new SecretsManagerClient({ region: "eu-west-1" })
  const AWS_MINTER_PK_SECRET_ID = "creator-nft-minter-pk"
  const AWS_MINTER_PK_SECRET_NAME = "creator_nft_minter_pk"

  const privateKey = await getSecret(client, AWS_MINTER_PK_SECRET_ID, AWS_MINTER_PK_SECRET_NAME)
  const walletAddress = addressUtils.fromPrivateKey(Buffer.from(privateKey, "hex"))

  return { walletAddress, privateKey }
}

/**
 * Resets the signal counter for a banned wallet with a given reason.
 * @param bannedWallet - The address of the wallet to reset the signal counter for.
 * @param reason - The reason for resetting the signal counter.
 * @returns An object containing the transaction receipt and gas result.
 */
const resetSignalCounter = async (thor: ThorClient, bannedWallet: string, reason: string) => {
  const { privateKey, walletAddress } = await getCallerWalletInfo()

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

/**
 * Retrieves the version of the VeBetterPassport contract.
 * @returns The version of the contract.
 */
const getContractVersion = async (thor: ThorClient) => {
  const getVersion = await thor.contracts.executeContractCall(
    localConfig.veBetterPassportContractAddress,
    VeBetterPassport__factory.createInterface().getFunction("version") as FunctionFragment,
    [],
  )

  return getVersion[0]
}

// Main execution function with error handling
const main = async () => {
  try {
    const thor = new ThorClient(new HttpClient(NODE_URL), { isPollingEnabled: false })

    const version = await getContractVersion(thor)
    console.log("Contract version:", version)

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
