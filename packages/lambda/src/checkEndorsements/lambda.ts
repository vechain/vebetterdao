import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import { AppEnv } from "@repo/config/contracts"
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"

import mainnetConfig from "@repo/config/mainnet"
import testnetStagingConfig from "@repo/config/testnet-staging"

import { checkEndorsements, getSecret, publishMessage } from "../helpers"

interface NetworkConfig {
  nodeUrl: string
  config: typeof mainnetConfig
}

interface SecretsConfig {
  secretId: string
  privateKeyKey: string
}

interface SlackConfig {
  channelId: string
  messagePrefix: string
}

const getNetworkConfig = (): NetworkConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        nodeUrl: MAINNET_URL,
        config: mainnetConfig,
      }

    case AppEnv.TESTNET_STAGING:
      return {
        nodeUrl: TESTNET_URL,
        config: testnetStagingConfig,
      }

    default:
      // Fallback to testnet for any other environment
      return {
        nodeUrl: TESTNET_URL,
        config: testnetStagingConfig,
      }
  }
}

const getSecretsConfig = (): SecretsConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        secretId: "start_emissions_pk",
        privateKeyKey: "start-emissions-pk",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "start_emissions_pk",
        privateKeyKey: "start-emissions-pk",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "start_emissions_pk",
        privateKeyKey: "start-emissions-pk",
      }
  }
}

const getSlackConfig = (): SlackConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  // C06BLEJE5SA - b3tr-dev (slack channel)
  // We are pointing this channel for both testnet and mainnet
  switch (environment) {
    case AppEnv.MAINNET:
      return {
        channelId: "C06BLEJE5SA",
        messagePrefix: "",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        channelId: "C06BLEJE5SA",
        messagePrefix: "[STAGING] ",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        channelId: "C06BLEJE5SA",
        messagePrefix: "[STAGING] ",
      }
  }
}

const { nodeUrl: NODE_URL, config: CONFIG } = getNetworkConfig()
const { secretId: SECRET_ID, privateKeyKey: PRIVATE_KEY_KEY } = getSecretsConfig()
const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()

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
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)
  console.log(`Network: ${NODE_URL}`)

  try {
    // Initialize the Thor client with the environment-specific URL and disable polling
    const thorClient = ThorClient.at(NODE_URL, {
      isPollingEnabled: false,
    })

    const privateKey = await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY)
    if (!privateKey) {
      throw new Error("Private key not found")
    }

    // Check the endorsements of the X-Apps
    const { receipt: receiptCheck, gasResult: gasResultCheck } = await checkEndorsements(
      thorClient,
      client,
      CONFIG,
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
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:white_check_mark: Check endorsements ran successfully`,
    )

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
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Error checking endorsements: ${error}`,
    )

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
