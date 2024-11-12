import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import _ from "lodash"
import { checkEndorsements, getSecret, publishMessage } from "../../helpers"
import mainnetConfig from "@repo/config/mainnet"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { HttpClient, ThorClient } from "@vechain/sdk-network"

// Define the URL for the Vechain Mainnet
const nodeURL = "https://mainnet.vechain.org/"

const client = new SecretsManagerClient({
  region: "eu-west-1",
})

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

    const privateKey = await getSecret(client, "start_emissions_pk", "start-emissions-pk")

    // Check the endorsements of the X-Apps
    const { receipt: receiptCheck, gasResult: gasResultCheck } = await checkEndorsements(
      thorClient,
      client,
      mainnetConfig,
      privateKey,
    )

    if (!receiptCheck)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResultCheck?.revertReasons}, ${gasResultCheck?.vmErrors}`,
        }),
      }

    // Publish a success message to the Slack channel
    await publishMessage(client, "C073WL9ELUR", `:white_check_mark: Check endorsements ran successfully`)

    // Return a successful response with the transaction receipt
    return {
      statusCode: 200,
      body: JSON.stringify({
        receiptCheck,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error checking endorsements:", error)

    // Publish an error message to the Slack channel
    await publishMessage(client, "C073WL9ELUR", `:alert: Error checking endorsements: ${error}`)

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
