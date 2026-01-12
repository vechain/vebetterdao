import { APIGatewayProxyResult, Context } from "aws-lambda"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import { Address } from "@vechain/sdk-core"

import stagingConfig from "@repo/config/testnet-staging"
import mainnetConfig from "@repo/config/mainnet"

import { getSecret } from "../helpers/secret"
import { CustomApiError, StandardApiError, SuccessResponseType } from "../helpers/api.types"
import { buildResponse } from "../helpers/api/response"
import { parseBatchSize, parseDryRunFlag, parseWalletAddresses } from "../helpers/api"
import { logger } from "../helpers/logger"
import { AppEnv } from "@repo/config/contracts"
import { AppConfig } from "@repo/config"
import { getCurrentRoundId } from "../helpers/xApps"
import { getAllAutoVotingEnabledUsers, getRoundSnapshot } from "../helpers/xallocationvoting"
import { processBatchedVotes } from "../helpers/xallocationvoting/batchVoteProcessor"
import { slackIds } from "../helpers/slack/slackIds"
import { notify } from "../helpers/slack/notificationHelper"

interface NetworkConfig {
  nodeUrl: string
  config: AppConfig
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
        config: stagingConfig,
      }

    default:
      // Fallback to testnet for any other environment
      return {
        nodeUrl: TESTNET_URL,
        config: stagingConfig,
      }
  }
}

const getSecretsConfig = (): SecretsConfig => {
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        secretId: "relayer_cast_vote_mainnet",
        privateKeyId: "relayer-cast-vote-pk",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "relayer_cast_vote_testnet",
        privateKeyId: "relayer-cast-vote-pk",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "relayer_cast_vote_testnet",
        privateKeyId: "relayer-cast-vote-pk",
      }
  }
}

const getSlackConfig = (): SlackConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  // Point them all to b3tr-lambda channel with Auto-Voting prefix
  switch (environment) {
    case AppEnv.MAINNET:
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[MAINNET][Auto-Voting] ",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[STAGING][Auto-Voting] ",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[STAGING][Auto-Voting] ",
      }
  }
}

const { nodeUrl: NODE_URL, config: CONFIG } = getNetworkConfig()
const { secretId: SECRET_ID, privateKeyId: PRIVATE_KEY_ID } = getSecretsConfig()
const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()
/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = async (): Promise<{ walletAddress: string; privateKey: string }> => {
  try {
    const client = new SecretsManagerClient({ region: "eu-west-1" })

    const privateKey = await getSecret(client, SECRET_ID, PRIVATE_KEY_ID)

    if (!privateKey) {
      throw new Error("Empty private key retrieved from secrets manager")
    }

    // Derive wallet address from private key
    const walletAddress = Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString()

    return { walletAddress, privateKey }
  } catch (error) {
    console.error("Failed to retrieve wallet credentials:", error)
    throw new Error(`Unable to get wallet credentials: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  const dryRun = parseDryRunFlag(event)
  const BATCH_SIZE = parseBatchSize(event, 50)
  const providedWallets = parseWalletAddresses(event)

  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)
  console.log(`Caller wallet address: ${(await getCallerWalletInfo()).walletAddress}`)
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)
  console.log(`Network: ${NODE_URL}`)
  console.log(`XAllocationVoting contract: ${CONFIG.xAllocationVotingContractAddress}`)
  console.log(`Dry Run Mode: ${dryRun}`)
  console.log(`Batch Size: ${BATCH_SIZE}`)
  console.log(
    `Wallet Mode: ${providedWallets ? `Specific (${providedWallets.length} addresses)` : "Auto-detect from events"}`,
  )

  try {
    const thorClient = ThorClient.at(NODE_URL, { isPollingEnabled: false })
    const secretsClient = new SecretsManagerClient({ region: "eu-west-1" })

    // Slack notification options - disabled during dry-run
    const slackOptions = dryRun
      ? undefined
      : {
          client: secretsClient,
          channelId: SLACK_CHANNEL_ID,
          messagePrefix: SLACK_MESSAGE_PREFIX,
        }

    // Get the current round information
    const currentRoundId = Number(await getCurrentRoundId(thorClient, CONFIG.xAllocationVotingContractAddress))
    const roundStartBlock = await getRoundSnapshot(thorClient, CONFIG.xAllocationVotingContractAddress, currentRoundId)

    logger.info("Round information retrieved", {
      roundId: currentRoundId,
      snapshotBlock: roundStartBlock,
    })

    // Determine which users to vote for: provided wallets or all auto-voting enabled users
    let usersToVoteFor: string[]
    if (providedWallets) {
      usersToVoteFor = providedWallets
      logger.info(`Processing specific wallets`, { count: providedWallets.length })
    } else {
      // Fetch all users with auto-voting enabled
      // Starting from block 0 will just skip to find the nearest block with AutoVotingToggled event
      usersToVoteFor = await getAllAutoVotingEnabledUsers(
        thorClient,
        CONFIG.xAllocationVotingContractAddress,
        0,
        roundStartBlock,
      )
      logger.info(`Fetched auto-voting enabled users`, { count: usersToVoteFor.length })
    }

    if (usersToVoteFor.length === 0) {
      await notify({
        level: "warn",
        message: `No users with auto-voting active found in round ${currentRoundId}`,
        data: { roundId: currentRoundId },
        slack: slackOptions,
      })
      return buildResponse(SuccessResponseType.SUCCESS, {
        message: `No users with auto-voting active found in round ${currentRoundId}`,
      })
    }

    // Get the caller wallet information (relayer wallet)
    const { privateKey, walletAddress } = await getCallerWalletInfo()

    // Cast votes on behalf of users using batch processor
    const batchResult = await processBatchedVotes(
      thorClient,
      CONFIG.xAllocationVotingContractAddress,
      usersToVoteFor,
      currentRoundId,
      walletAddress,
      privateKey,
      BATCH_SIZE,
      dryRun,
    )

    // Check if we managed to cast any votes at all
    if (batchResult.successfulVotes === 0) {
      await notify({
        level: "error",
        message: `Failed to cast any votes in round ${currentRoundId}`,
        data: {
          roundId: currentRoundId,
          totalAttempted: usersToVoteFor.length,
          failedVotes: batchResult.failedVotes,
          transientFailures: batchResult.transientFailures,
        },
        slack: slackOptions,
      })
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, {
        message: `Failed to cast any votes in round ${currentRoundId}`,
        failedVotes: batchResult.failedVotes,
        transientFailures: batchResult.transientFailures,
      })
    }

    // Log failures (no voting power or invalid state) if any
    if (batchResult.failedVotes.length > 0) {
      await notify({
        level: "warn",
        message: `${batchResult.failedVotes.length} votes failed in round ${currentRoundId} (no voting power or invalid state).`,
        data: {
          successfulVotes: batchResult.successfulVotes,
          failedVotes: batchResult.failedVotes.length,
          failedVoteDetails: batchResult.failedVotes,
        },
        slack: slackOptions,
      })
    }

    // Log transient failures (RPC/network issues) if any
    if (batchResult.transientFailures.length > 0) {
      await notify({
        level: "warn",
        message: `${batchResult.transientFailures.length} votes failed due to RPC/network issues in round ${currentRoundId}. These users are valid but hit max retries.`,
        data: {
          successfulVotes: batchResult.successfulVotes,
          transientFailures: batchResult.transientFailures.length,
          transientFailureDetails: batchResult.transientFailures,
        },
        slack: slackOptions,
      })
    }

    await notify({
      level: "success",
      message: dryRun
        ? `Auto-voting simulation completed for round ${currentRoundId} (DRY RUN). Successfully simulated ${batchResult.successfulVotes} votes.`
        : `Auto-voting completed for round ${currentRoundId}. Successfully cast ${batchResult.successfulVotes} votes.`,
      data: {
        totalUsers: usersToVoteFor.length,
        successfulVotes: batchResult.successfulVotes,
        failedVotes: batchResult.failedVotes.length,
        transientFailures: batchResult.transientFailures.length,
        roundId: currentRoundId,
        transactions: batchResult.transactionIds.length,
        dryRun,
        // Include detailed failures in dry-run mode for easier debugging
        ...(dryRun && batchResult.failedVotes.length > 0 ? { failedVoteDetails: batchResult.failedVotes } : {}),
        ...(dryRun && batchResult.transientFailures.length > 0
          ? { transientFailureDetails: batchResult.transientFailures }
          : {}),
      },
      slack: slackOptions,
    })

    return buildResponse(SuccessResponseType.SUCCESS, {
      successfulVotes: batchResult.successfulVotes,
      failedVotes: batchResult.failedVotes,
      transientFailures: batchResult.transientFailures,
      transactionIds: batchResult.transactionIds,
      roundId: currentRoundId,
      dryRun,
    })
  } catch (error) {
    logger.error("Lambda execution failed", error)

    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
