import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import testnetConfig from "@repo/config/testnet"
import { EmissionsContractJson } from "@repo/contracts"
import { FunctionFragment } from "ethers"
import { addressUtils, clauseBuilder, coder } from "@vechain/sdk-core"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

// Serialize the ABI of the Emissions contract for use in contract interaction
const emissionsABI = JSON.stringify(EmissionsContractJson.abi)

// Define the URL for the Vechain testnet
const nodeURL = "https://testnet.vechain.org/"

const client = new SecretsManagerClient({
  region: "eu-north-1",
})

/**
 * Retrieves the private key from AWS Secrets Manager
 */
async function getPrivateKey(): Promise<string> {
  const secretId = "start_emissions_pk"
  const data = await client.send(new GetSecretValueCommand({ SecretId: secretId }))

  if (data.SecretString) {
    return JSON.parse(data.SecretString)["start-emissions-pk"]
  }
  throw new Error("Secret not found or invalid")
}

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
    const privateKey = await getPrivateKey()

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
      addressUtils.fromPrivateKey(Buffer.from(privateKey, "hex")),
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
    const signedTx = await thorClient.transactions.signTransaction(txBody, privateKey)

    // Send the signed transaction to the blockchain
    const tx = await thorClient.transactions.sendTransaction(signedTx)

    // Wait for the transaction to be processed and get the receipt
    const receipt = await thorClient.transactions.waitForTransaction(tx.id)

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
