import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import soloStagingConfig from "@repo/config/solo-staging"
import { EmissionsContractJson } from "@repo/contracts"
import { FunctionFragment } from "ethers"
import { coder } from "@vechain/sdk-core"

// Serialize the ABI (Application Binary Interface) of the Emissions contract
const emissionsABI = JSON.stringify(EmissionsContractJson.abi)

// URL for the Thor solo node in the development rewards network
const stagingURL = "https://thor-solo.dev.rewards.vechain.org/"

// Developer account's private key, publicly available for testing purposes
const DEV_PK = "99f0500549792796c14fed62011a51081dc5b5e68fe8bd8a13b86be829c4fd36"

/**
 * Asynchronously waits for the start of the next round by querying the blockchain for
 * the next cycle block number and pausing execution until it is reached.
 *
 * @param {ThorClient} thor - Initialized Thor client for interacting with the blockchain.
 */
async function waitForRoundStart(thor: ThorClient) {
  // Execute a contract call to get the block number of the next cycle
  const nextRoundBlock = await thor.contracts.executeContractCall(
    soloStagingConfig.emissionsContractAddress,
    coder.createInterface(emissionsABI).getFunction("getNextCycleBlock") as FunctionFragment,
    [],
  )

  // Wait for the blockchain to reach the block number of the next cycle
  await thor.blocks.waitForBlockCompressed(Number(nextRoundBlock[0]), { intervalMs: 1000 })
}

/**
 * AWS Lambda handler function for processing events from API Gateway.
 * It waits for the next emissions round to start and then triggers the distribution function of the contract.
 *
 * @param {APIGatewayEvent} event - The event data received from API Gateway.
 * @param {Context} context - The runtime context of the Lambda function.
 * @returns {Promise<APIGatewayProxyResult>} - The HTTP response object.
 */
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Log the received event and context for debugging purposes
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)

  try {
    // Initialize a Thor client with the staging URL and disable polling
    const thorClient = new ThorClient(new HttpClient(stagingURL), {
      isPollingEnabled: false,
    })

    // Wait for the next round to start
    await waitForRoundStart(thorClient)

    // Execute a contract transaction to distribute emissions
    const tx = await thorClient.contracts.executeContractTransaction(
      DEV_PK,
      soloStagingConfig.emissionsContractAddress,
      coder.createInterface(emissionsABI).getFunction("distribute") as FunctionFragment,
      [],
    )

    // Wait for the transaction to complete and obtain the receipt
    const receipt = await tx.wait()

    // Return a successful HTTP response containing the transaction receipt
    return {
      statusCode: 200,
      body: JSON.stringify({
        receipt,
      }),
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.error("Error starting the round:", error)
    // Return an error response if the process fails
    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
