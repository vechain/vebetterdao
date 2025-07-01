import { AppConfig } from "@repo/config"
import { Emissions__factory as Emissions } from "@repo/contracts"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { buildCheckEndorsementClauses, chunk, getAllApps } from "../xApps"
import { publishMessage } from "../slack"
import { ThorClient, TransactionReceipt } from "@vechain/sdk-network"
import { AppEnv } from "@repo/config/contracts"
import { ABIContract, Address, Transaction } from "@vechain/sdk-core"

/**
 * Checks the endorsements of the X-Apps before distributing the X-Allocations.
 *
 * @param thor - The ThorClient instance
 * @returns an array of transaction receipts if successful and the gas result of the last transaction
 */

// Define a type for the EstimateGasResult based on its usage and expected structure
// This is necessary because EstimateGasResult is not directly exported by the SDK
type EstimateGasResultType = {
  reverted: boolean
  revertReasons?: (string | bigint)[]
  vmErrors?: string[]
  totalGas: number
  // Add other potential fields from EstimateGasResult if known or needed
}

export async function checkEndorsements(
  thor: ThorClient,
  secretsClient: SecretsManagerClient,
  config: AppConfig,
  privateKey: string,
): Promise<{ receipt: TransactionReceipt | null; gasResult: EstimateGasResultType | null }> {
  const isStaging = config.environment === AppEnv.TESTNET_STAGING

  // Get the current round number from the Emissions contract
  const response = await thor.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions.abi).getFunction("getCurrentCycle"),
    [],
  )

  if (!response.success) {
    throw new Error("Failed to get current round")
  }

  const currentRound = response.result?.array?.[0] as string

  // Get the eligible X-Apps for the current round
  const xApps = await getAllApps(thor, currentRound, config)

  // Split X-Apps into chunks of 200
  const xAppsChunks = chunk(xApps, 200)
  let lastReceipt = null
  let lastGasResult = null
  for (const xAppsChunk of xAppsChunks) {
    // Build the check endorsement clauses for the current chunk of X-Apps
    const checkendorsementClauses = buildCheckEndorsementClauses(xAppsChunk)

    // Estimate the gas cost for the transaction
    const senderAddress = Address.ofPrivateKey(Buffer.from(privateKey, "hex"))
    const gasResult = await thor.gas.estimateGas(checkendorsementClauses, senderAddress.toString())

    // Check if the transaction was estimated to revert and handle accordingly
    if (gasResult.reverted) {
      console.log("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)

      await publishMessage(
        secretsClient,
        "C06BLEJE5SA",
        `${isStaging ? "[STAGING] " : ""}:alert: Failed to check endorsemets:\n${gasResult.revertReasons}, ${
          gasResult.vmErrors
        }`,
      )

      return { receipt: null, gasResult }
    }

    // Build the transaction body with the estimated gas
    const txBody = await thor.transactions.buildTransactionBody(checkendorsementClauses, gasResult.totalGas)

    // Sign the transaction with the developer's private key
    const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))

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
