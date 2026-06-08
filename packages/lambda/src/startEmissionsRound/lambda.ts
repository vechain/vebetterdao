import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import testnetStagingConfig from "@repo/config/testnet-staging"
import { AppEnv } from "@repo/config/contracts"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { getSecret } from "../helpers/secret"
import { waitForRoundStart, detectRoundState } from "../helpers/emissions"
import { publishMessage } from "../helpers/slack"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"
import { buildTxBody, buildGasEstimate, withRetry } from "../helpers"
import { slackIds } from "../helpers/slack/slackIds"
import { logger } from "../helpers/logger"

interface NetworkConfig {
  nodeUrl: string
  config: typeof mainnetConfig
}

interface SecretsConfig {
  secretId: string
  privateKeyId: string
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
        privateKeyId: "start-emissions-pk",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "start_emissions_pk",
        privateKeyId: "start-emissions-pk",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "start_emissions_pk",
        privateKeyId: "start-emissions-pk",
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
        channelId: slackIds.b3trDev,
        messagePrefix: "",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[STAGING] ",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[STAGING] ",
      }
  }
}

const { nodeUrl: NODE_URL, config: CONFIG } = getNetworkConfig()
const { secretId: SECRET_ID, privateKeyId: PRIVATE_KEY_KEY } = getSecretsConfig()
const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()

const client = new SecretsManagerClient({
  region: "eu-west-1",
})

/**
 * Reads the current cycle number from the Emissions contract.
 */
async function getCurrentCycleId(thor: ThorClient): Promise<number> {
  const res = await thor.contracts.executeCall(
    CONFIG.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getCurrentCycle"),
    [],
  )
  return Number(res.result?.array?.[0] ?? 0)
}

/**
 * Distributes the VeBetterDAO emissions and starts the next round.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the distribution of emissions if successful and the gas result
 */
export async function distributeEmissions(thor: ThorClient) {
  const privateKey = Buffer.from(await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY), "hex")
  const signerAddress = Address.ofPrivateKey(privateKey).toString()

  // Save current round ID before attempting distribution
  const roundIdBefore = await getCurrentCycleId(thor)

  // Prepare the contract function call with necessary parameters
  const clause = Clause.callFunction(
    Address.of(CONFIG.emissionsContractAddress),
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("distribute"),
    [],
  )

  // Estimate the gas cost for the transaction
  let gasResult = await buildGasEstimate(thor, [clause], signerAddress)

  // Check if the transaction was estimated to revert and handle accordingly
  if (gasResult.reverted) {
    // Check if the round was already started (by us or someone else)
    const roundIdAfter = await getCurrentCycleId(thor)
    if (roundIdAfter > roundIdBefore) {
      console.log(
        `Gas estimation reverted but round already advanced (${roundIdBefore} -> ${roundIdAfter}). Proceeding.`,
      )
      return { receipt: null, gasResult, roundAlreadyStarted: true }
    }

    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Round failed to start: ${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, gasResult, roundAlreadyStarted: false }
  }

  // Build the transaction body with the estimated gas
  // 2x the gas limit for the gas used by the transaction,
  // this increases the gas limit but the transaction will only charge the actual gas used
  let txBody = await buildTxBody(thor, [clause], gasResult.totalGas * 2)

  // Sign the transaction with the developer's private key
  let signedTx = Transaction.of(txBody).sign(privateKey)

  // Send the signed transaction to the blockchain
  let tx = await thor.transactions.sendTransaction(signedTx)

  // Wait for the transaction to be processed and get the receipt
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  if (!receipt) {
    console.log("WARNING: Emissions distribution transaction was sent but receipt was not received")
    console.log(`Transaction ID: ${tx.id}`)

    // Check if the round actually started on-chain despite not receiving a receipt
    const roundIdAfter = await getCurrentCycleId(thor)
    if (roundIdAfter > roundIdBefore) {
      console.log(`No receipt but round advanced on-chain (${roundIdBefore} -> ${roundIdAfter}). Treating as success.`)
      return { receipt: null, gasResult, roundAlreadyStarted: true }
    }
  }

  return { receipt, gasResult, roundAlreadyStarted: false }
}

/**
 * AWS Lambda handler function that triggers on API Gateway events. It starts the emissions round
 * by calling Emissions.distribute() once the next cycle block is reached.
 *
 * X-Allocations claims and DBA rewards are distributed by the separate `distributeWeeklyAppRewards`
 * lambda, which is scheduled 5 minutes after this one.
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

  const maxRetries = 5
  const delayMs = 3000

  try {
    // Initialize the Thor client with the environment-specific URL and disable polling
    const thorClient = ThorClient.at(NODE_URL, {
      isPollingEnabled: false,
    })

    // Detect the current round state to determine if we should skip distribution
    const roundState = await detectRoundState(thorClient, CONFIG)
    console.log("Round state:", roundState)

    let receiptEmissions = null
    let gasResultEmissions = null

    // Check if we should skip the distribute step (it was already called in a previous run)
    if (roundState.shouldSkipDistribute) {
      logger.info(
        `Skipping start round. Current block: ${roundState.currentBlock}, Next cycle block: ${roundState.nextCycleBlock}, Blocks until next cycle: ${roundState.blocksUntilNextCycle}`,
      )
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:information_source: Round ${roundState.currentCycle}. Skipping start round because we are (${roundState.blocksUntilNextCycle} blocks away, exceeds waiting period).`,
      )

      return {
        statusCode: 200,
        body: JSON.stringify({ skipped: true, reason: "shouldSkipDistribute", roundState }),
      }
    }

    // Wait for the next round to start before proceeding
    // If the round does not start within 5 minutes, we will retry 3 times with a 1 second delay
    try {
      await withRetry(() => waitForRoundStart(thorClient, CONFIG), 3, 1000, "Wait for Round Start")
    } catch (error) {
      console.log("Failed to wait for round start after all retries:", error)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Failed to wait for round start after multiple attempts: ${error}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to wait for round start: ${error}` }),
      }
    }

    // Re-check if the round was already started while we were waiting
    // This handles the race condition where someone else calls distribute() concurrently
    const recheckState = await detectRoundState(thorClient, CONFIG)
    if (recheckState.shouldSkipDistribute) {
      logger.info(
        `Detected round was started by another process while waiting. Current block: ${recheckState.currentBlock}, Next cycle block: ${recheckState.nextCycleBlock}`,
      )
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:information_source: Round ${recheckState.currentCycle} started by another process while waiting.`,
      )

      return {
        statusCode: 200,
        body: JSON.stringify({ skipped: true, reason: "startedByAnotherProcess", recheckState }),
      }
    }

    // Distribute the emissions to the VeBetterDAO and start the next round with retry
    let emissionsResult
    try {
      emissionsResult = await withRetry(
        () => distributeEmissions(thorClient),
        maxRetries,
        delayMs,
        "Distribute Emissions",
      )
    } catch (error) {
      console.log("Failed to distribute emissions after all retries:", error)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Failed to distribute emissions after multiple attempts: ${error}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to distribute emissions: ${error}` }),
      }
    }

    const { receipt, gasResult, roundAlreadyStarted } = emissionsResult
    receiptEmissions = receipt
    gasResultEmissions = gasResult

    if (roundAlreadyStarted) {
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:information_source: Round already started, skipping emissions distribution.`,
      )
    } else if (!receiptEmissions) {
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Transaction reverted: ${gasResultEmissions.revertReasons}, ${gasResultEmissions.vmErrors}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResultEmissions.revertReasons}, ${gasResultEmissions.vmErrors}`,
        }),
      }
    } else {
      // Log the transaction receipt for debugging and verification
      console.log("Receipt:", receiptEmissions)

      // Publish a success message to the Slack channel
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:white_check_mark: Round started successfully`,
      )
    }

    // Return a successful response with the transaction receipt
    return {
      statusCode: 200,
      body: JSON.stringify({
        receiptEmissions,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error starting the round:", error)

    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Error starting emissions round: ${error}`,
    )

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
