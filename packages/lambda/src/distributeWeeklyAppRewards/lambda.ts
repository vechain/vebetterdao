import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import testnetStagingConfig from "@repo/config/testnet-staging"
import { AppEnv } from "@repo/config/contracts"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { buildClaimClause, getAllApps, getIdsOfUnclaimed } from "../helpers/xApps"
import { detectRoundState } from "../helpers/emissions"
import { getSecret } from "../helpers/secret"
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

// X-Allocations claims use the start_emissions_pk key (same signer used by the
// startEmissionsRound lambda).
const getXAllocationsSecretsConfig = (): SecretsConfig => {
  return {
    secretId: "start_emissions_pk",
    privateKeyId: "start-emissions-pk",
  }
}

// DBA distribution uses a separate key with DISTRIBUTOR_ROLE on the DBAPool contract
const getDBASecretsConfig = (): SecretsConfig => {
  return {
    secretId: "dba_distributor_pk",
    privateKeyId: "dba-distributor-pk",
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
const { secretId: X_ALLOC_SECRET_ID, privateKeyId: X_ALLOC_PRIVATE_KEY_KEY } = getXAllocationsSecretsConfig()
const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()

const client = new SecretsManagerClient({
  region: "eu-west-1",
})

// DBAPool ABI (V4) - extracted from contract interface. The eligible-apps array is no longer passed;
// the contract derives it on-chain from XAllocationVoting + VeBetterPassport + X2EarnApps state.
const DBAPoolAbi = [
  {
    inputs: [{ internalType: "uint256", name: "_roundId", type: "uint256" }],
    name: "canDistributeDBARewards",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_roundId", type: "uint256" }],
    name: "distributeDBARewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_roundId", type: "uint256" }],
    name: "eligibleAppsForRound",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const

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
 * Max clauses per transaction to stay well under the 40M block gas limit.
 * Each claim costs ~300-500K gas; 30 claims * 500K * 1.1 padding ≈ 16.5M, safely under limit.
 */
const X_ALLOCATION_BATCH_SIZE = 30

export async function distributeXAllocations(thor: ThorClient) {
  const privateKey = await getSecret(client, X_ALLOC_SECRET_ID, X_ALLOC_PRIVATE_KEY_KEY)

  if (!privateKey) {
    throw new Error("Private key not found")
  }

  const walletAddress = Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString()

  // Refetch current cycle fresh to ensure we claim the correct round after emissions distribution
  const currentRound = await getCurrentCycleId(thor)
  const previousRound = currentRound - 1

  logger.info(`Distributing X-Allocations for round ${previousRound} (current cycle: ${currentRound})`)

  const xApps = await getAllApps(thor, CONFIG, previousRound.toString())
  const xAppIds = await getIdsOfUnclaimed(thor, CONFIG, xApps, previousRound.toString())
  logger.info("X-App IDs", { xAppIds })

  if (xAppIds.length === 0) {
    console.log(
      `No X-Apps need to claim allocations for round ${previousRound} (${xApps.length} total apps, 0 unclaimed)`,
    )
    return { receipts: [], allClaimed: true, failedBatches: 0 }
  }

  const claimClauses = []
  const failedXAppIds: string[] = []

  for (const xAppId of xAppIds) {
    const claimClause = buildClaimClause(CONFIG, xAppId, previousRound.toString())
    const gasResult = await thor.gas.estimateGas([claimClause], walletAddress)

    if (!gasResult.reverted) {
      claimClauses.push(claimClause)
    } else {
      failedXAppIds.push(xAppId)
    }
  }

  logger.info("Claim clauses", { claimClauses, ineligibleApps: failedXAppIds, xAppIdsCount: xAppIds.length })

  if (claimClauses.length === 0) {
    logger.info(`No claim clauses to distribute X-Allocations for round ${previousRound}`)
    return { receipts: [], allClaimed: true, failedBatches: 0 }
  }

  // Split into batches to avoid exceeding block gas limit
  const totalBatches = Math.ceil(claimClauses.length / X_ALLOCATION_BATCH_SIZE)
  const receipts = []
  let failedBatches = 0

  for (let i = 0; i < claimClauses.length; i += X_ALLOCATION_BATCH_SIZE) {
    const batch = claimClauses.slice(i, i + X_ALLOCATION_BATCH_SIZE)
    const batchNum = Math.floor(i / X_ALLOCATION_BATCH_SIZE) + 1

    logger.info(`Processing X-Allocation batch ${batchNum}/${totalBatches}`, { clausesInBatch: batch.length })

    const gasResult = await buildGasEstimate(thor, batch, walletAddress)

    if (gasResult.reverted) {
      logger.error(`Batch ${batchNum} gas estimation reverted`, undefined, {
        revertReasons: gasResult.revertReasons,
        vmErrors: gasResult.vmErrors,
      })
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: X-Allocations batch ${batchNum}/${totalBatches} reverted: ${gasResult.revertReasons}`,
      )
      failedBatches++
      continue
    }

    const txBody = await buildTxBody(thor, batch, gasResult.totalGas)
    const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
    const tx = await thor.transactions.sendTransaction(signedTx)
    const receipt = await thor.transactions.waitForTransaction(tx.id)

    if (receipt) {
      receipts.push(receipt)
    } else {
      logger.warn(`Batch ${batchNum} receipt not received`, { txId: tx.id })
    }
  }

  return { receipts, allClaimed: false, failedBatches }
}

/**
 * Distributes DBA rewards to eligible apps for the previous round.
 * Uses a separate private key (dba_distributor_pk) that has DISTRIBUTOR_ROLE on DBAPool.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the DBA distribution if successful
 */
async function distributeDBARewards(thor: ThorClient) {
  // Check if DBA Pool is deployed (address is not zero)
  if (CONFIG.dbaPoolContractAddress === "0x0000000000000000000000000000000000000000") {
    console.log("DBA Pool is not deployed yet, skipping DBA distribution")
    return { receipt: null, eligibleAppsCount: 0, skipped: true, notDeployed: true }
  }

  // Get the current round number from the Emissions contract
  const currentRound = await getCurrentCycleId(thor)
  // Get the previous round number for which the DBA rewards are to be distributed
  const roundId = currentRound - 1

  console.log(`Current round: ${currentRound}, distributing DBA for previous round: ${roundId}`)

  // Use DBA-specific secrets (different key with DISTRIBUTOR_ROLE on DBAPool)
  const { secretId: dbaSecretId, privateKeyId: dbaPrivateKeyId } = getDBASecretsConfig()
  const privateKey = Buffer.from(await getSecret(client, dbaSecretId, dbaPrivateKeyId), "hex")
  const signerAddress = Address.ofPrivateKey(privateKey).toString()

  // Check if we can distribute for this round
  // This function already checks if rewards were distributed, if round is ready, etc.
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
    console.log(`Round ${roundId} is not ready for DBA distribution (already distributed or not ready yet)`)
    return { receipt: null, eligibleAppsCount: 0, skipped: true, notReady: true }
  }

  // Read the contract's view of the eligible set for monitoring/logging purposes. The contract
  // will independently re-derive it during the distribute call — we don't pass it.
  const eligibleRes = await thor.contracts.executeCall(
    CONFIG.dbaPoolContractAddress,
    ABIContract.ofAbi(DBAPoolAbi).getFunction("eligibleAppsForRound"),
    [roundId],
  )
  const eligibleApps = (eligibleRes.result?.array?.[0] as string[] | undefined) ?? []
  console.log(`On-chain eligible set has ${eligibleApps.length} app(s) for round ${roundId}`)

  // Prepare the V4 contract function call (no array argument)
  const clause = Clause.callFunction(
    Address.of(CONFIG.dbaPoolContractAddress),
    ABIContract.ofAbi(DBAPoolAbi).getFunction("distributeDBARewards"),
    [roundId],
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

  const txBody = await buildTxBody(thor, [clause], gasResult.totalGas)

  // Sign the transaction
  const signedTx = Transaction.of(txBody).sign(privateKey)

  // Send the signed transaction to the blockchain
  const tx = await thor.transactions.sendTransaction(signedTx)

  // Wait longer for heavy multi-app DBA transactions (default SDK timeout is too short)
  let receipt = await thor.transactions.waitForTransaction(tx.id, { timeoutMs: 60_000 })

  // Retry receipt fetch once -- the tx was sent, it may just need another block cycle
  if (!receipt) {
    console.log(`DBA receipt not found after 60s, retrying in 10s... (txId: ${tx.id})`)
    await new Promise(resolve => setTimeout(resolve, 10_000))
    receipt = await thor.transactions.getTransactionReceipt(tx.id)
  }

  if (!receipt) {
    console.log(`WARNING: DBA distribution receipt not received for round ${roundId} -- tx may still succeed on-chain`)
    console.log(`Transaction ID: ${tx.id}`)
    return { receipt: null, eligibleAppsCount: eligibleApps.length, gasResult }
  }

  console.log(`DBA distribution successful for round ${roundId}`)

  return { receipt, eligibleAppsCount: eligibleApps.length, gasResult }
}

/**
 * AWS Lambda handler function that distributes weekly app rewards for the previous round.
 *
 * Runs two independent steps:
 *  1. X-Allocations claim (`XAllocationPool.claim()` per app, in batches)
 *  2. DBA rewards distribution (`DBAPool.distributeDBARewards()` over eligible apps)
 *
 * Scheduled to run 5 minutes after `startEmissionsRound`. Both steps are no-op when there is
 * nothing to distribute (no unclaimed allocations / DBA already distributed), so it is safe to
 * run independently and even re-run manually.
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

    // Only distribute after the new round has started. Cycle blocks drift later in wall-clock
    // time every week, so scheduled runs can fire before Emissions.distribute() was called for
    // the current cycle; in that case currentRound - 1 points at the round that was already
    // distributed last week and this run would be a misleading no-op.
    const roundState = await detectRoundState(thorClient, CONFIG)
    if (!roundState.hasRoundStarted) {
      logger.info(
        `Round ${roundState.currentCycle} has not started yet (${roundState.blocksUntilNextCycle} blocks until next cycle). Skipping distribution, a later catch-up run will handle it.`,
      )
      return {
        statusCode: 200,
        body: JSON.stringify({ skipped: true, reason: "roundNotStartedYet", roundState }),
      }
    }

    // Distribute X-Allocations in batches to avoid exceeding block gas limit
    let xAllocationsResult
    try {
      xAllocationsResult = await withRetry(
        () => distributeXAllocations(thorClient),
        maxRetries,
        delayMs,
        "Distribute X-Allocations",
      )
    } catch (error) {
      const errorMsg = String(error)
      console.log("Failed to distribute X-Allocations after all retries:", errorMsg)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Failed to distribute X-Allocations after multiple attempts: ${errorMsg}`,
      )

      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to distribute X-Allocations: ${errorMsg}` }),
      }
    }

    const { receipts: receiptsClaim, allClaimed, failedBatches } = xAllocationsResult

    if (allClaimed) {
      // Log only: catch-up runs after a successful distribution land here on every execution,
      // publishing to Slack would spam the channel.
      console.log("No X-Apps need to claim allocations - skipping")
    } else if (receiptsClaim.length > 0) {
      console.log(`X-Allocations distributed in ${receiptsClaim.length} batch(es)`)
      const failedMsg = failedBatches > 0 ? ` (${failedBatches} batch(es) failed)` : ""
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:white_check_mark: X-Allocations distributed in ${receiptsClaim.length} tx(s)${failedMsg}`,
      )
    } else if (failedBatches > 0) {
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: All ${failedBatches} X-Allocation batch(es) failed`,
      )
    }

    // Distribute DBA rewards for the previous round with retry
    let dbaResult
    try {
      dbaResult = await withRetry(() => distributeDBARewards(thorClient), maxRetries, delayMs, "Distribute DBA Rewards")
    } catch (error) {
      console.log("Failed to distribute DBA rewards after all retries:", error)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Failed to distribute DBA rewards after multiple attempts: ${error}`,
      )
      // Don't fail the entire lambda if DBA distribution fails
      // X-allocations may have succeeded
      return {
        statusCode: 200,
        body: JSON.stringify({
          receiptsClaim,
          dbaError: `Failed to distribute DBA rewards: ${error}`,
        }),
      }
    }

    const { receipt: receiptDBA, eligibleAppsCount, skipped, notDeployed, notReady } = dbaResult

    // Log DBA result for debugging
    console.log("DBA Result:", {
      hasReceipt: !!receiptDBA,
      receiptType: receiptDBA ? typeof receiptDBA : "null/undefined",
      dbaResult,
    })

    if (notDeployed) {
      // Log only: on environments without a DBA Pool every catch-up run would land here.
      console.log("DBA Pool not deployed yet, skipping")
    } else if (notReady) {
      // Log only: catch-up runs after a successful distribution land here on every execution,
      // publishing to Slack would spam the channel.
      console.log("DBA distribution not ready yet (already distributed or round not ready)")
    } else if (skipped) {
      console.log("DBA distribution skipped (no eligible apps)")
    } else if (!receiptDBA) {
      console.log("DBA distribution: receipt not received (tx was sent, may still succeed on-chain)")
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:warning: DBA distribution tx sent but receipt not received. Tx may still succeed on-chain. Check logs for tx ID.`,
      )
    } else {
      console.log("DBA distribution successful")
      console.log("DBA Receipt:", receiptDBA)
      await publishMessage(
        client,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:white_check_mark: DBA rewards distributed successfully to ${eligibleAppsCount} apps`,
      )
    }

    // Return a successful response with the transaction receipts
    return {
      statusCode: 200,
      body: JSON.stringify({
        receiptsClaim,
        receiptDBA,
        dbaEligibleAppsCount: eligibleAppsCount,
        dbaSkipped: skipped,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error distributing weekly app rewards:", error)

    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Error distributing weekly app rewards: ${error}`,
    )

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
