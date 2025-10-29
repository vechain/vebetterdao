import { APIGatewayProxyResult, Context } from "aws-lambda"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import { Address } from "@vechain/sdk-core"

import stagingConfig from "@repo/config/testnet-staging"
import mainnetConfig from "@repo/config/mainnet"

import { getSecret } from "../helpers/secret"
import { CustomApiError, StandardApiError, SuccessResponseType } from "../helpers/api.types"
import { buildResponse } from "../helpers/api/response"
import { logger } from "../helpers/logger"
import { AppEnv } from "@repo/config/contracts"
import { AppConfig } from "@repo/config"
import { getCurrentRoundId } from "../helpers/xApps"
import {
  getAllAutoVotingEnabledUsers,
  castVotesOnBehalfOf,
  getRoundSnapshot,
  verifyAutoVotingUsersIsActive,
} from "../helpers/xallocationvoting"
import { publishMessage } from "../helpers/slack"
import { slackIds } from "../helpers/slack/slackIds"

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
  // eslint-disable-next-line turbo/no-undeclared-env-vars
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

  // Point them all to b3tr-lambda channel
  switch (environment) {
    case AppEnv.MAINNET:
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[MAINNET] ",
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
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)
  console.log(`Caller wallet address: ${(await getCallerWalletInfo()).walletAddress}`)
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)
  console.log(`Network: ${NODE_URL}`)
  console.log(`XAllocationVoting contract: ${CONFIG.xAllocationVotingContractAddress}`)

  try {
    const thorClient = ThorClient.at(NODE_URL, { isPollingEnabled: false })
    const secretsClient = new SecretsManagerClient({ region: "eu-west-1" })

    // Get the current round ID
    const currentRoundId = Number(await getCurrentRoundId(thorClient, CONFIG.xAllocationVotingContractAddress))

    if (currentRoundId === 0) {
      logger.warn("No active round found")
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: "No active round found",
      })
    }

    // Get the round start block number
    const roundStartBlock = await getRoundSnapshot(thorClient, CONFIG.xAllocationVotingContractAddress, currentRoundId)

    logger.info("Round information retrieved", {
      roundId: currentRoundId,
      snapshotBlock: roundStartBlock,
    })

    // Fetch all users with auto-voting enabled and 'active' at the round start block
    const usersToVoteFor = await getAllAutoVotingEnabledUsers(
      thorClient,
      CONFIG.xAllocationVotingContractAddress,
      0,
      roundStartBlock,
    )

    // Verify that all users are 'active' at the round start block
    const { allValid, validUsers, invalidUsers } = await verifyAutoVotingUsersIsActive(
      thorClient,
      CONFIG.xAllocationVotingContractAddress,
      usersToVoteFor,
      currentRoundId,
    )

    if (!allValid) {
      logger.warn("Invalid users detected, notifying Slack", {
        invalidUsers,
        roundId: currentRoundId,
      })
      await publishMessage(
        secretsClient,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:warning: Invalid users found: ${invalidUsers}`,
      )
    }

    if (validUsers.length === 0) {
      logger.info("No users with auto-voting enabled")
      return buildResponse(SuccessResponseType.SUCCESS, {
        message: "No users with auto-voting active found",
      })
    }

    // Get the caller wallet information (relayer wallet)
    const { privateKey, walletAddress } = await getCallerWalletInfo()

    // Cast votes on behalf of users
    const { receipt, gasResult } = await castVotesOnBehalfOf(
      thorClient,
      CONFIG.xAllocationVotingContractAddress,
      validUsers,
      currentRoundId,
      walletAddress,
      privateKey,
    )

    if (!receipt) {
      logger.error("Transaction reverted", undefined, {
        revertReasons: gasResult?.revertReasons,
        vmErrors: gasResult?.vmErrors,
      })
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, {
        revertReasons: gasResult?.revertReasons,
        vmErrors: gasResult?.vmErrors,
      })
    }

    logger.info("Votes cast successfully", {
      usersVoted: validUsers.length,
      roundId: currentRoundId,
      txId: receipt.meta.txID,
    })

    return buildResponse(SuccessResponseType.SUCCESS, {
      receipt,
      usersVoted: validUsers.length,
      roundId: currentRoundId,
    })
  } catch (error) {
    logger.error("Lambda execution failed", error)

    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
