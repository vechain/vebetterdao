import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import testnetConfig from "@repo/config/testnet"
import { EmissionsContractJson } from "@repo/contracts"
import { FunctionFragment } from "ethers"
import { addressUtils, clauseBuilder, coder } from "@vechain/sdk-core"

// Serialize the ABI of the Emissions contract for use in contract interaction
const emissionsABI = JSON.stringify(EmissionsContractJson.abi)

// Define the URL for the Vechain testnet
const nodeURL = "https://testnet.vechain.org/"

// Developer account private key, publicly available
const DEV_PK = "99f0500549792796c14fed62011a51081dc5b5e68fe8bd8a13b86be829c4fd36"

/**
 * Asynchronously waits for the start of the next emissions round by checking the next cycle block
 * and waiting until the blockchain reaches that block.
 *
 * @param {ThorClient} thor - An initialized Thor client for blockchain interactions.
 */
async function waitForRoundStart(thor: ThorClient) {
  // Execute a contract call to get the block number of the next cycle
  const nextRoundBlock = await thor.contracts.executeContractCall(
    testnetConfig.emissionsContractAddress,
    coder.createInterface(emissionsABI).getFunction("getNextCycleBlock") as FunctionFragment,
    [],
  )

  // Wait for the blockchain to reach the specified block number
  await thor.blocks.waitForBlockCompressed(Number(nextRoundBlock[0]), { intervalMs: 10000 })
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

    // Wait for the next round to start before proceeding
    await waitForRoundStart(thorClient)

    // Prepare the contract function call with necessary parameters
    const clause = clauseBuilder.functionInteraction(
      testnetConfig.emissionsContractAddress,
      coder.createInterface(emissionsABI).getFunction("distribute") as FunctionFragment,
      [],
    )

    // Estimate the gas cost for the transaction
    const gasResult = await thorClient.gas.estimateGas(
      [clause],
      addressUtils.fromPrivateKey(Buffer.from(DEV_PK, "hex")),
    )

    // Check if the transaction was estimated to revert and handle accordingly
    if (gasResult.reverted) {
      console.log("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResult.revertReasons}, ${gasResult.vmErrors}`,
        }),
      }
    }

    // Build the transaction body with the estimated gas
    const txBody = await thorClient.transactions.buildTransactionBody([clause], gasResult.totalGas)

    // Sign the transaction with the developer's private key
    const signedTx = await thorClient.transactions.signTransaction(txBody, DEV_PK)

    // Send the signed transaction to the blockchain
    const tx = await thorClient.transactions.sendTransaction(signedTx)

    // Wait for the transaction to be processed and get the receipt
    const receipt = await tx.wait()

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receipt)

    // Return a successful response with the transaction receipt
    return {
      statusCode: 200,
      body: JSON.stringify({
        receipt,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error starting the round:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
