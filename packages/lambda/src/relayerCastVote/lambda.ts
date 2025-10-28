import { APIGatewayProxyResult, Context } from "aws-lambda"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"

import stagingConfig from "@repo/config/testnet-staging"
import mainnetConfig from "@repo/config/mainnet"

import { getSecret } from "../helpers/secret"
import { CustomApiError, StandardApiError, SuccessResponseType } from "../helpers/api.types"
import { buildResponse } from "../helpers/api/response"
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
  walletKey: string
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
        walletKey: "WALLET",
        privateKeyKey: "RELAYER_PK",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "relayer_cast_vote_testnet",
        walletKey: "WALLET",
        privateKeyKey: "RELAYER_PK",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "relayer_cast_vote_testnet",
        walletKey: "WALLET",
        privateKeyKey: "RELAYER_PK",
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
const { secretId: SECRET_ID, walletKey: WALLET_KEY, privateKeyKey: PRIVATE_KEY_KEY } = getSecretsConfig()
const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()
/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = async (): Promise<{ walletAddress: string; privateKey: string }> => {
  try {
    const client = new SecretsManagerClient({ region: "eu-west-1" })

    const walletAddress = await getSecret(client, SECRET_ID, WALLET_KEY)
    const privateKey = await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY)

    if (!walletAddress || !privateKey) {
      throw new Error("Empty wallet credentials retrieved from secrets manager")
    }

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
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)
  console.log(`Network: ${NODE_URL}`)
  console.log(`XAllocationVoting contract: ${CONFIG.xAllocationVotingContractAddress}`)

  try {
    const thorClient = ThorClient.at(NODE_URL, { isPollingEnabled: false })
    const secretsClient = new SecretsManagerClient({ region: "eu-west-1" })

    // Get the current round ID
    const currentRoundId = Number(await getCurrentRoundId(thorClient, CONFIG.xAllocationVotingContractAddress))
    console.log(`Current round ID: ${currentRoundId}`)

    if (currentRoundId === 0) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: "No active round found",
      })
    }

    // Get the round start block number
    const roundStartBlock = await getRoundSnapshot(thorClient, CONFIG.xAllocationVotingContractAddress, currentRoundId)
    console.log(`Round start block: ${roundStartBlock}`)

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
      await publishMessage(
        secretsClient,
        SLACK_CHANNEL_ID,
        `${SLACK_MESSAGE_PREFIX}:alert: Invalid users found: ${invalidUsers}`,
      )
    }

    if (usersToVoteFor.length === 0) {
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
      usersToVoteFor,
      currentRoundId,
      walletAddress,
      privateKey,
    )

    if (!receipt) {
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, {
        revertReasons: gasResult?.revertReasons,
        vmErrors: gasResult?.vmErrors,
      })
    }

    return buildResponse(SuccessResponseType.SUCCESS, {
      receipt,
      usersVoted: usersToVoteFor.length,
      roundId: currentRoundId,
    })
  } catch (error) {
    console.error("Error casting votes on behalf of users:", error)

    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
