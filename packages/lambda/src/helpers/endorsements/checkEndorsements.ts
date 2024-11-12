import { AppConfig } from "@repo/config"
import { Emissions__factory as Emissions } from "@repo/contracts"
import { getSecret } from "../secret"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { buildCheckEndorsementClauses, chunk, getAllApps } from "../xApps"
import { addressUtils, FunctionFragment } from "@vechain/sdk-core"
import { publishMessage } from "../slack"
import { ThorClient } from "@vechain/sdk-network"

/**
 * Checks the endorsements of the X-Apps before distributing the X-Allocations.
 *
 * @param thor - The ThorClient instance
 * @returns an array of transaction receipts if successful and the gas result of the last transaction
 */
export async function checkEndorsements(
  thor: ThorClient,
  secretsClient: SecretsManagerClient,
  config: AppConfig,
  privateKey: string,
) {
  const isStaging = config.environment === "testnet-staging"

  // Get the current round number from the Emissions contract
  const currentRound = await thor.contracts.executeContractCall(
    config.emissionsContractAddress,
    Emissions.createInterface().getFunction("getCurrentCycle") as FunctionFragment,
    [],
  )

  // Get the eligible X-Apps for the current round
  const xApps = await getAllApps(thor, currentRound[0], config)

  // Split X-Apps into chunks of 200
  const xAppsChunks = chunk(xApps, 200)
  let lastReceipt = null
  let lastGasResult = null
  for (const xAppsChunk of xAppsChunks) {
    // Build the check endorsement clauses for the current chunk of X-Apps
    const checkendorsementClauses = buildCheckEndorsementClauses(xAppsChunk)

    // Estimate the gas cost for the transaction
    const gasResult = await thor.gas.estimateGas(
      checkendorsementClauses,
      addressUtils.fromPrivateKey(Buffer.from(privateKey, "hex")),
    )

    // Check if the transaction was estimated to revert and handle accordingly
    if (gasResult.reverted) {
      console.log("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)

      await publishMessage(
        secretsClient,
        "C06BLEJE5SA",
        `${isStaging ? "[STAGING] " : ""}:alert: Failed to check endorsemets:\n${gasResult.revertReasons}, ${gasResult.vmErrors}`,
      )

      return { receipt: null, gasResult }
    }

    // Build the transaction body with the estimated gas
    const txBody = await thor.transactions.buildTransactionBody(checkendorsementClauses, gasResult.totalGas)

    // Sign the transaction with the developer's private key
    const signedTx = await thor.transactions.signTransaction(txBody, privateKey)

    // Send the signed transaction to the blockchain
    const tx = await thor.transactions.sendTransaction(signedTx)

    // Wait for the transaction receipt
    lastReceipt = await thor.transactions.waitForTransaction(tx.id)

    // Update the last gas result
    lastGasResult = gasResult
  }

  // Return all transaction receipts and the last gas result
  return { receipt: lastReceipt, gasResult: lastGasResult }
}
