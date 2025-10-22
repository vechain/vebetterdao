import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import testnetStagingConfig from "@repo/config/testnet-staging"
import { AppEnv } from "@repo/config/contracts"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { buildClaimClause, getAllApps, getIdsOfUnclaimed } from "../helpers/xApps"
import { getSecret } from "../helpers/secret"
import { waitForRoundStart } from "../helpers/emissions"
import { publishMessage } from "../helpers/slack"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"
import { buildTxBody, buildGasEstimate, withRetry } from "../helpers"
import { slackIds } from "../helpers/slack/slackIds"
import { filterEligibleAppsForDBA } from "../helpers/dba"

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

/**
 * Distributes the VeBetterDAO emissions and starts the next round.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the distribution of emissions if successful and the gas result
 */
export async function distributeEmissions(thor: ThorClient) {
  const privateKey = Buffer.from(await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY), "hex")
  const signerAddress = Address.ofPrivateKey(privateKey).toString()

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
    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Round failed to start: ${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, gasResult }
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

  return { receipt, gasResult }
}

/**
 * Distributes X-Allocations to the X-App addresses that have not yet claimed their allocations.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the distribution of X-Allocations if successful and the gas result
 */
export async function distributeXAllocations(thor: ThorClient) {
  const privateKey = await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY)

  if (!privateKey) {
    throw new Error("Private key not found")
  }

  // Get the current round number from the Emissions contract
  const currentRound = await thor.contracts.executeCall(
    CONFIG.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getCurrentCycle"),
    [],
  )
  // Get the previous round number for which the X-Allocations are to be distributed
  const previousRound = Number(currentRound.result?.array?.[0] ?? 0) - 1

  // Get the X-Apps for the current round
  const xApps = await getAllApps(thor, CONFIG, previousRound.toString())

  // Get the IDs of the X-Apps that have not yet claimed their allocations
  const xAppIds = await getIdsOfUnclaimed(thor, CONFIG, xApps, previousRound.toString())

  const claimClauses = []

  // Build the claim clauses for the X-Apps that have not yet claimed their allocations and the gas estimation does not revert
  for (const xAppId of xAppIds) {
    const claimClause = buildClaimClause(CONFIG, xAppId, previousRound.toString())

    // Estimate the gas cost for the transaction
    const gasResult = await thor.gas.estimateGas(
      [claimClause],
      Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString(),
    )

    // Check if the transaction was estimated to revert and handle accordingly
    if (!gasResult.reverted) {
      claimClauses.push(claimClause)
    }
  }

  // Estimate the gas cost for the transaction
  const gasResult = await buildGasEstimate(
    thor,
    claimClauses,
    Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString(),
  )

  // Check if the transaction was estimated to revert and handle accordingly
  if (gasResult.reverted) {
    console.log("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)

    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Failed to distribute X-Allocations:\n${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, gasResult }
  }

  // Build the transaction body with the estimated gas
  const txBody = await buildTxBody(thor, claimClauses, gasResult.totalGas * 2)

  // Sign the transaction with the developer's private key
  const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))

  // Send the signed transaction to the blockchain
  const tx = await thor.transactions.sendTransaction(signedTx)

  const receipt = await thor.transactions.waitForTransaction(tx.id)

  // Return the transaction receipt
  return { receipt, gasResult }
}

/**
 * Distributes DBA rewards to eligible apps for the previous round.
 * This should be called after emissions are distributed and x-allocations are claimed.
 *
 * @param thor - The ThorClient instance
 * @param roundId - The round ID to distribute DBA rewards for
 * @returns the transaction receipt of the DBA distribution if successful
 */
async function distributeDBARewards(thor: ThorClient, roundId: number) {
  console.log(`Starting DBA distribution for round ${roundId}`)

  // Check if DBA Pool is deployed (address is not zero)
  if (CONFIG.dbaPoolContractAddress === "0x0000000000000000000000000000000000000000") {
    console.log("DBA Pool is not deployed yet, skipping DBA distribution")
    return { receipt: null, eligibleAppsCount: 0, skipped: true, notDeployed: true }
  }

  const privateKey = Buffer.from(await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY), "hex")
  const signerAddress = Address.ofPrivateKey(privateKey).toString()

  // Check if we can distribute for this round
  const canDistributeRes = await thor.contracts.executeCall(
    CONFIG.dbaPoolContractAddress,
    ABIContract.ofAbi(DBAPoolAbi).getFunction("canDistributeDBARewards"),
    [roundId],
  )

  if (!canDistributeRes.success) {
    throw new Error("Failed to check if DBA can be distributed")
  }

  const canDistribute = canDistributeRes.result?.array?.[0] ?? false

  if (!canDistribute) {
    console.log(`Round ${roundId} is not ready for DBA distribution yet`)
    return { receipt: null, eligibleAppsCount: 0, skipped: true, notReady: true }
  }

  // Check if already distributed
  const isDistributedRes = await thor.contracts.executeCall(
    CONFIG.dbaPoolContractAddress,
    ABIContract.ofAbi(DBAPoolAbi).getFunction("isDBARewardsDistributed"),
    [roundId],
  )

  if (!isDistributedRes.success) {
    throw new Error("Failed to check if DBA was already distributed")
  }

  const isDistributed = isDistributedRes.result?.array?.[0] ?? false

  if (isDistributed) {
    console.log(`Round ${roundId} has already been distributed`)
    return { receipt: null, eligibleAppsCount: 0, skipped: true, alreadyDistributed: true }
  }

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

  const maxRetries = 5
  const delayMs = 3000

  try {
    // Initialize the Thor client with the environment-specific URL and disable polling
    const thorClient = ThorClient.at(NODE_URL, {
      isPollingEnabled: false,
    })

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

    const { receipt: receiptEmissions, gasResult: gasResultEmissions } = emissionsResult

    if (!receiptEmissions) {
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
    }

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receiptEmissions)

    // Publish a success message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:white_check_mark: Round started successfully`,
    )

    // Distribute the X-Allocations to the X-App addresses that have not yet claimed them with retry
    let xAllocationsResult
    try {
      xAllocationsResult = await withRetry(
        () => distributeXAllocations(thorClient),
        maxRetries,
        delayMs,
        "Distribute X-Allocations",
      )
    } catch (error) {
      console.log("Failed to distribute X-Allocations after all retries:", error)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Failed to distribute X-Allocations after multiple attempts: ${error}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to distribute X-Allocations: ${error}` }),
      }
    }

    const { receipt: receiptClaim, gasResult: gasResultXallocations } = xAllocationsResult

    if (!receiptClaim) {
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: X-Allocations transaction reverted: ${gasResultXallocations.revertReasons}, ${gasResultXallocations.vmErrors}`,
      )
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResultXallocations.revertReasons}, ${gasResultXallocations.vmErrors}`,
        }),
      }
    }

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receiptClaim)

    // Publish a success message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:white_check_mark: X-Allocations distributed successfully`,
    )

    // Get the previous round number for DBA distribution
    const currentRoundRes = await thorClient.contracts.executeCall(
      CONFIG.emissionsContractAddress,
      ABIContract.ofAbi(Emissions__factory.abi).getFunction("getCurrentCycle"),
      [],
    )
    const currentRound = Number(currentRoundRes.result?.array?.[0] ?? 0)
    const previousRound = currentRound - 1

    console.log(`Current round: ${currentRound}, distributing DBA for previous round: ${previousRound}`)

    // Distribute DBA rewards for the previous round with retry
    let dbaResult
    try {
      dbaResult = await withRetry(
        () => distributeDBARewards(thorClient, previousRound),
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
      // Don't fail the entire lambda if DBA distribution fails
      // The round has already started successfully
      return {
        statusCode: 200,
        body: JSON.stringify({
          receiptEmissions,
          receiptClaim,
          dbaError: `Failed to distribute DBA rewards: ${error}`,
        }),
      }
    }

    const { receipt: receiptDBA, eligibleAppsCount, skipped, notDeployed, notReady, alreadyDistributed } = dbaResult

    if (notDeployed) {
      console.log("DBA Pool not deployed yet, skipping")
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:information_source: DBA Pool not deployed yet, skipping DBA distribution`,
      )
    } else if (notReady) {
      console.log("DBA distribution not ready yet")
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:information_source: Round ${previousRound} is not ready for DBA distribution yet`,
      )
    } else if (alreadyDistributed) {
      console.log("DBA already distributed for this round")
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:information_source: DBA rewards already distributed for round ${previousRound}`,
      )
    } else if (skipped) {
      console.log("DBA distribution skipped (no eligible apps)")
    } else if (!receiptDBA) {
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: DBA distribution transaction reverted for round ${previousRound}`,
      )
    } else {
      console.log("DBA distribution successful")
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:white_check_mark: DBA rewards distributed successfully for round ${previousRound} to ${eligibleAppsCount} apps`,
      )
    }

    // Return a successful response with the transaction receipt
    return {
      statusCode: 200,
      body: JSON.stringify({
        receiptEmissions,
        receiptClaim,
        receiptDBA,
        dbaEligibleAppsCount: eligibleAppsCount,
        dbaSkipped: skipped,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error starting the round:", error)

    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Error starting round or distributing allocations: ${error}`,
    )

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
