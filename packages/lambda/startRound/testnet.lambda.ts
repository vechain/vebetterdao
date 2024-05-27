import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import testnetConfig from "@repo/config/testnet"
import { EmissionsContractJson } from "@repo/contracts"
import { FunctionFragment } from "ethers"
import { addressUtils, clauseBuilder, coder } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { buildClaimClauses, getRoundXApps } from "./helpers/xApps"
import { getIdsOfUnclaimed } from "./helpers/xApps"
import { getSecret } from "./helpers/secret"
import { waitForRoundStart } from "./helpers/emissions"
import { publishMessage } from "./helpers/slack"

// Serialize the ABI of the Emissions contract for use in contract interaction
const emissionsABI = JSON.stringify(EmissionsContractJson.abi)

// Define the URL for the Vechain testnet
const nodeURL = "https://testnet.vechain.org/"

const client = new SecretsManagerClient({
  region: "eu-north-1",
})

/**
 * Distributes the VeBetterDAO emissions and starts the next round.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the distribution of emissions if successful and the gas result
 */
async function distributeEmissions(thor: ThorClient) {
  const privateKey = await getSecret(client, "start_emissions_pk", "start-emissions-pk")

  // Wait for the next round to start before proceeding
  await waitForRoundStart(thor)

  // Prepare the contract function call with necessary parameters
  const clause = clauseBuilder.functionInteraction(
    testnetConfig.emissionsContractAddress,
    coder.createInterface(emissionsABI).getFunction("distribute") as FunctionFragment,
    [],
  )

  // Estimate the gas cost for the transaction
  let gasResult = await thor.gas.estimateGas([clause], addressUtils.fromPrivateKey(Buffer.from(privateKey, "hex")))

  // Check if the transaction was estimated to revert and handle accordingly
  if (gasResult.reverted) {
    console.log("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)

    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      "C06BLEJE5SA",
      `:alert: Round failed to start: ${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, gasResult }
  }

  // Build the transaction body with the estimated gas
  let txBody = await thor.transactions.buildTransactionBody([clause], gasResult.totalGas)

  // Sign the transaction with the developer's private key
  let signedTx = await thor.transactions.signTransaction(txBody, privateKey)

  // Send the signed transaction to the blockchain
  let tx = await thor.transactions.sendTransaction(signedTx)

  // Wait for the transaction to be processed and get the receipt
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}

/**
 * Distributes X-Allocations to the X-App addresses that have not yet claimed their allocations.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the distribution of X-Allocations if successful and the gas result
 */
async function distributeXAllocations(thor: ThorClient) {
  const privateKey = await getSecret(client, "start_emissions_pk", "start-emissions-pk")

  // Get the current round number from the Emissions contract
  const currentRound = await thor.contracts.executeContractCall(
    testnetConfig.emissionsContractAddress,
    coder.createInterface(emissionsABI).getFunction("getCurrentCycle") as FunctionFragment,
    [],
  )

  // Get the previous round number for which the X-Allocations are to be distributed
  const previousRound = Number(currentRound[0]) - 1

  // Get the X-Apps for the current round
  const xApps = await getRoundXApps(thor, previousRound.toString())

  // Get the IDs of the X-Apps that have not yet claimed their allocations
  const xAppIds = await getIdsOfUnclaimed(thor, xApps, previousRound.toString())

  // Build the claim clauses for the X-Apps
  const claimClauses = buildClaimClauses(xAppIds, previousRound.toString())

  // Estimate the gas cost for the transaction
  const gasResult = await thor.gas.estimateGas(
    claimClauses,
    addressUtils.fromPrivateKey(Buffer.from(privateKey, "hex")),
  )

  // Check if the transaction was estimated to revert and handle accordingly
  if (gasResult.reverted) {
    console.log("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)

    await publishMessage(
      client,
      "C06BLEJE5SA",
      `:alert: Failed to distribute X-Allocations:\n${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, gasResult }
  }

  // Build the transaction body with the estimated gas
  const txBody = await thor.transactions.buildTransactionBody(claimClauses, gasResult.totalGas)

  // Sign the transaction with the developer's private key
  const signedTx = await thor.transactions.signTransaction(txBody, privateKey)

  // Send the signed transaction to the blockchain
  const tx = await thor.transactions.sendTransaction(signedTx)

  const receipt = await thor.transactions.waitForTransaction(tx.id)

  // Return the transaction receipt
  return { receipt, gasResult }
}

/**
 * AWS Lambda handler function that triggers on API Gateway events. It initiates the distribution
 * process of emissions by interacting with the Emissions contract.
 *
 * @param {APIGatewayEvent} event - The incoming event from API Gateway.
 * @param {Context} context - The execution context of the Lambda function.
 * @returns {Promise<APIGatewayProxyResult>} - The result of the HTTP response.
 */
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Log event and context for debugging and tracking
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)

  try {
    // Initialize the Thor client with the testnet URL and disable polling
    const thorClient = new ThorClient(new HttpClient(nodeURL), {
      isPollingEnabled: false,
    })

    // Distribute the emissions to the VeBetterDAO and start the next round
    const { receipt: receiptEmissions, gasResult: gasResultEmissions } = await distributeEmissions(thorClient)

    if (!receiptEmissions)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResultEmissions.revertReasons}, ${gasResultEmissions.vmErrors}`,
        }),
      }

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receiptEmissions)

    // Publish a success message to the Slack channel
    await publishMessage(client, "C06BLEJE5SA", `:white_check_mark: Round started successfully`)

    // Distribute the X-Allocations to the X-App addresses that have not yet claimed them
    const { receipt: receiptClaim, gasResult: gasResultXallocations } = await distributeXAllocations(thorClient)

    if (!receiptClaim)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResultXallocations.revertReasons}, ${gasResultXallocations.vmErrors}`,
        }),
      }

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receiptClaim)

    // Publish a success message to the Slack channel
    await publishMessage(client, "C06BLEJE5SA", `:white_check_mark: X-Allocations distributed successfully`)

    // Return a successful response with the transaction receipt
    return {
      statusCode: 200,
      body: JSON.stringify({
        receiptEmissions,
        receiptClaim,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error starting the round:", error)

    // Publish an error message to the Slack channel
    await publishMessage(client, "C06BLEJE5SA", `:alert: Error starting the round: ${error}`)

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
