import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import testnetStagingConfig from "@repo/config/testnet-staging"
import { AppEnv } from "@repo/config/contracts"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { getSecret } from "../helpers/secret"
import { publishMessage } from "../helpers/slack"
import { slackIds } from "../helpers/slack/slackIds"
import { buildTxBody, buildGasEstimate, withRetry } from "../helpers"
import { filterEligibleAppsForDBA } from "../helpers/dba"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"

// DBAPool ABI - extracted from contract interface
const DBAPoolAbi = [
  {
    inputs: [{ internalType: "uint256", name: "_roundId", type: "uint256" }],
    name: "canDistributeDBARewards",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_roundId", type: "uint256" },
      { internalType: "bytes32[]", name: "_appIds", type: "bytes32[]" },
    ],
    name: "distributeDBARewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_roundId", type: "uint256" }],
    name: "fundsForRound",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_roundId", type: "uint256" }],
    name: "isDBARewardsDistributed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const

interface NetworkConfig {
  nodeUrl: string
  config: typeof mainnetConfig & { dbaPoolContractAddress: string }
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
        config: {
          ...mainnetConfig,
          // TODO: Add the actual DBAPool contract address once deployed
          dbaPoolContractAddress: process.env.DBA_POOL_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
        },
      }

    case AppEnv.TESTNET_STAGING:
      return {
        nodeUrl: TESTNET_URL,
        config: {
          ...testnetStagingConfig,
          // TODO: Add the actual DBAPool contract address once deployed
          dbaPoolContractAddress: process.env.DBA_POOL_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
        },
      }

    default:
      // Fallback to testnet for any other environment
      return {
        nodeUrl: TESTNET_URL,
        config: {
          ...testnetStagingConfig,
          dbaPoolContractAddress: process.env.DBA_POOL_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
        },
      }
  }
}

const getSecretsConfig = (): SecretsConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        secretId: "dba_distributor_pk",
        privateKeyId: "dba-distributor-pk",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "dba_distributor_pk",
        privateKeyId: "dba-distributor-pk",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "dba_distributor_pk",
        privateKeyId: "dba-distributor-pk",
      }
  }
}

const getSlackConfig = (): SlackConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

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
 * Gets the previous round ID that is eligible for DBA distribution
 *
 * @param thor - The ThorClient instance
 * @returns The round ID to distribute DBA rewards for, or null if no round is ready
 */
async function getRoundToDistribute(thor: ThorClient): Promise<number | null> {
  // Get the current round number from the Emissions contract
  const currentRoundRes = await thor.contracts.executeCall(
    CONFIG.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getCurrentCycle"),
    [],
  )

  if (!currentRoundRes.success) {
    throw new Error("Failed to get current round")
  }

  const currentRound = Number(currentRoundRes.result?.array?.[0] ?? 0)
  const previousRound = currentRound - 1

  console.log(`Current round: ${currentRound}, checking previous round: ${previousRound}`)

  // Check if the previous round can be distributed
  const canDistributeRes = await thor.contracts.executeCall(
    CONFIG.dbaPoolContractAddress,
    ABIContract.ofAbi(DBAPoolAbi).getFunction("canDistributeDBARewards"),
    [previousRound],
  )

  if (!canDistributeRes.success) {
    throw new Error("Failed to check if DBA can be distributed")
  }

  const canDistribute = canDistributeRes.result?.array?.[0] ?? false

  if (!canDistribute) {
    console.log(`Round ${previousRound} is not ready for DBA distribution`)
    return null
  }

  // Check if already distributed
  const isDistributedRes = await thor.contracts.executeCall(
    CONFIG.dbaPoolContractAddress,
    ABIContract.ofAbi(DBAPoolAbi).getFunction("isDBARewardsDistributed"),
    [previousRound],
  )

  if (!isDistributedRes.success) {
    throw new Error("Failed to check if DBA was already distributed")
  }

  const isDistributed = isDistributedRes.result?.array?.[0] ?? false

  if (isDistributed) {
    console.log(`Round ${previousRound} has already been distributed`)
    return null
  }

  console.log(`Round ${previousRound} is ready for DBA distribution`)
  return previousRound
}

/**
 * Distributes DBA rewards to eligible apps for a specific round
 *
 * @param thor - The ThorClient instance
 * @param roundId - The round ID to distribute DBA rewards for
 * @returns the transaction receipt of the DBA distribution if successful
 */
export async function distributeDBARewards(thor: ThorClient, roundId: number) {
  console.log(`Starting DBA distribution for round ${roundId}`)

  const privateKey = Buffer.from(await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY), "hex")
  const signerAddress = Address.ofPrivateKey(privateKey).toString()

  // Filter eligible apps
  const eligibleApps = await filterEligibleAppsForDBA(thor, CONFIG, roundId)

  if (eligibleApps.length === 0) {
    console.log(`No eligible apps found for round ${roundId}`)
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:information_source: No eligible apps found for DBA distribution in round ${roundId}`,
    )
    return { receipt: null, eligibleAppsCount: 0, skipped: true }
  }

  console.log(`Found ${eligibleApps.length} eligible apps for DBA distribution`)

  // Get the amount to be distributed
  const fundsRes = await thor.contracts.executeCall(
    CONFIG.dbaPoolContractAddress,
    ABIContract.ofAbi(DBAPoolAbi).getFunction("fundsForRound"),
    [roundId],
  )

  if (!fundsRes.success) {
    throw new Error("Failed to get funds for round")
  }

  const totalFunds = fundsRes.result?.array?.[0] ?? 0n
  console.log(`Total funds to distribute: ${totalFunds}`)

  // Prepare the contract function call
  const clause = Clause.callFunction(
    Address.of(CONFIG.dbaPoolContractAddress),
    ABIContract.ofAbi(DBAPoolAbi).getFunction("distributeDBARewards"),
    [roundId, eligibleApps],
  )

  // Estimate the gas cost for the transaction
  const gasResult = await buildGasEstimate(thor, [clause], signerAddress)

  // Check if the transaction was estimated to revert and handle accordingly
  if (gasResult.reverted) {
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: DBA distribution failed for round ${roundId}: ${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, eligibleAppsCount: eligibleApps.length, gasResult }
  }

  // Build the transaction body with the estimated gas
  // 2x the gas limit for safety
  const txBody = await buildTxBody(thor, [clause], gasResult.totalGas * 2)

  // Sign the transaction
  const signedTx = Transaction.of(txBody).sign(privateKey)

  // Send the signed transaction to the blockchain
  const tx = await thor.transactions.sendTransaction(signedTx)

  // Wait for the transaction to be processed and get the receipt
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  console.log(`DBA distribution successful for round ${roundId}`)

  return { receipt, eligibleAppsCount: eligibleApps.length, gasResult }
}

/**
 * AWS Lambda handler function that triggers DBA rewards distribution.
 * This lambda should be scheduled to run once per week, after the round has started
 * and allocations have been claimed.
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

    // Check if there's a round ready for DBA distribution
    let roundToDistribute: number | null
    try {
      roundToDistribute = await withRetry(() => getRoundToDistribute(thorClient), 3, 1000, "Get Round To Distribute")
    } catch (error) {
      console.log("Failed to get round to distribute after all retries:", error)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Failed to check for rounds ready for DBA distribution: ${error}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to check for rounds: ${error}` }),
      }
    }

    if (roundToDistribute === null) {
      console.log("No rounds ready for DBA distribution at this time")
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No rounds ready for DBA distribution",
          skipped: true,
        }),
      }
    }

    // Distribute DBA rewards with retry
    let distributionResult
    try {
      distributionResult = await withRetry(
        () => distributeDBARewards(thorClient, roundToDistribute as number),
        maxRetries,
        delayMs,
        "Distribute DBA Rewards",
      )
    } catch (error) {
      console.log("Failed to distribute DBA rewards after all retries:", error)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Failed to distribute DBA rewards after multiple attempts: ${error}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to distribute DBA rewards: ${error}` }),
      }
    }

    const { receipt, eligibleAppsCount, skipped } = distributionResult

    if (skipped) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `No eligible apps found for DBA distribution in round ${roundToDistribute}`,
          roundId: roundToDistribute,
          eligibleAppsCount: 0,
        }),
      }
    }

    if (!receipt) {
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: DBA distribution transaction reverted for round ${roundToDistribute}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Transaction reverted",
          roundId: roundToDistribute,
        }),
      }
    }

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receipt)

    // Publish a success message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:white_check_mark: DBA rewards distributed successfully for round ${roundToDistribute} to ${eligibleAppsCount} apps`,
    )

    // Return a successful response
    return {
      statusCode: 200,
      body: JSON.stringify({
        receipt,
        roundId: roundToDistribute,
        eligibleAppsCount,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error distributing DBA rewards:", error)

    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Error distributing DBA rewards: ${error}`,
    )

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
