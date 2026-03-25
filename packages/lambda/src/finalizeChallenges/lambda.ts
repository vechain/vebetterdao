"use strict"

import { APIGatewayProxyResult, Context } from "aws-lambda"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { AppConfig } from "@repo/config"
import mainnetConfig from "@repo/config/mainnet"
import stagingConfig from "@repo/config/testnet-staging"
import { AppEnv } from "@repo/config/contracts"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"

import { aggregateAllEvents, buildGasEstimate, buildTxBody, getCurrentRoundId, getSecret, withRetry } from "../helpers"
import { parseBatchSize, parseDryRunFlag } from "../helpers/api"
import { buildResponse } from "../helpers/api/response"
import { CustomApiError, StandardApiError, SuccessResponseType } from "../helpers/api.types"
import { logger } from "../helpers/logger"
import { notify } from "../helpers/slack/notificationHelper"
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

interface FinalizeBatchResult {
  success: boolean
  txId?: string
  reason?: string
  vmError?: string
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const DEFAULT_BATCH_SIZE = 25
const MAX_BATCHES_PER_CHALLENGE = 200

const ChallengeStatus = {
  Pending: 0,
  Active: 1,
  Finalizing: 2,
  Finalized: 3,
  Cancelled: 4,
  Invalid: 5,
} as const

const challengesContract = ABIContract.ofAbi(B3TRChallenges__factory.abi)

const getNetworkConfig = (): NetworkConfig => {
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
        secretId: "dba_distributor_pk",
        privateKeyId: "dba-distributor-pk",
      }
    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "dba_distributor_pk",
        privateKeyId: "dba-distributor-pk",
      }
    default:
      return {
        secretId: "dba_distributor_pk",
        privateKeyId: "dba-distributor-pk",
      }
  }
}

const getSlackConfig = (): SlackConfig => {
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[MAINNET][Challenges] ",
      }
    case AppEnv.TESTNET_STAGING:
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[STAGING][Challenges] ",
      }
    default:
      return {
        channelId: slackIds.b3trLambda,
        messagePrefix: "[STAGING][Challenges] ",
      }
  }
}

const { nodeUrl: NODE_URL, config: CONFIG } = getNetworkConfig()
const { secretId: SECRET_ID, privateKeyId: PRIVATE_KEY_ID } = getSecretsConfig()
const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()

const getCallerWalletInfo = async (): Promise<{ walletAddress: string; privateKey: string }> => {
  const client = new SecretsManagerClient({ region: "eu-west-1" })
  const privateKey = await getSecret(client, SECRET_ID, PRIVATE_KEY_ID)

  if (!privateKey) {
    throw new Error("Empty private key retrieved from secrets manager")
  }

  return {
    privateKey,
    walletAddress: Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString(),
  }
}

const isZeroAddress = (address?: string) => !address || address.toLowerCase() === ZERO_ADDRESS

const getEndedChallengeIds = async (
  thor: ThorClient,
  challengesContractAddress: string,
  endRound: number,
): Promise<{ challengeIds: number[]; totalEvents: number }> => {
  const challengeCreatedEvent = challengesContract.getEvent("ChallengeCreated") as any
  const topics = challengeCreatedEvent.encodeFilterTopicsNoNull({ endRound: BigInt(endRound) })

  const { result, totalEvents } = await aggregateAllEvents(
    thor,
    challengesContractAddress,
    challengeCreatedEvent,
    topics,
    0,
    undefined,
    (challengeIds: Set<number>, _log: unknown, decodedData: any) => {
      challengeIds.add(Number(decodedData.args.challengeId))
      return challengeIds
    },
    new Set<number>(),
  )

  return {
    challengeIds: Array.from(result).sort((left, right) => left - right),
    totalEvents,
  }
}

const getChallengeStatus = async (
  thor: ThorClient,
  challengesContractAddress: string,
  challengeId: number,
): Promise<number> => {
  const res = await thor.contracts.executeCall(
    challengesContractAddress,
    challengesContract.getFunction("getChallengeStatus"),
    [challengeId],
  )

  if (!res.success) {
    throw new Error(`Failed to fetch challenge status for ${challengeId}: ${res.result.errorMessage}`)
  }

  return Number(res.result?.array?.[0] ?? -1)
}

const finalizeSingleBatch = async (
  thor: ThorClient,
  challengesContractAddress: string,
  challengeId: number,
  batchSize: number,
  walletAddress: string,
  privateKey: string,
  dryRun: boolean,
): Promise<FinalizeBatchResult> => {
  const clause = Clause.callFunction(
    Address.of(challengesContractAddress),
    challengesContract.getFunction("finalizeChallengeBatch"),
    [challengeId, batchSize],
  )

  const gasResult = await buildGasEstimate(thor, [clause], walletAddress)

  if (gasResult.reverted) {
    return {
      success: false,
      reason: String(gasResult.revertReasons?.[0] ?? "Gas estimation reverted"),
      vmError: gasResult.vmErrors?.[0] ? String(gasResult.vmErrors[0]) : undefined,
    }
  }

  if (dryRun) {
    return {
      success: true,
      txId: `dry-run-${challengeId}`,
    }
  }

  const txBody = await buildTxBody(thor, [clause], gasResult.totalGas)
  const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  if (!receipt) {
    return {
      success: false,
      reason: "Receipt not found",
    }
  }

  if (receipt.reverted) {
    return {
      success: false,
      reason: "Transaction reverted",
    }
  }

  return {
    success: true,
    txId: tx.id,
  }
}

export const handler = async (event: unknown, _context: Context): Promise<APIGatewayProxyResult> => {
  const dryRun = parseDryRunFlag(event)
  const batchSize = parseBatchSize(event, DEFAULT_BATCH_SIZE)

  logger.info("Starting finalizeChallenges lambda", {
    dryRun,
    batchSize,
    challengesContractAddress: CONFIG.challengesContractAddress,
    environment: process.env.LAMBDA_ENV ?? AppEnv.TESTNET_STAGING,
  })

  if (isZeroAddress(CONFIG.challengesContractAddress)) {
    return buildResponse(SuccessResponseType.SUCCESS, {
      message: "Challenges contract is not configured yet.",
    })
  }

  try {
    const thor = ThorClient.at(NODE_URL, { isPollingEnabled: false })
    const secretsClient = new SecretsManagerClient({ region: "eu-west-1" })
    const slackOptions = dryRun
      ? undefined
      : {
          client: secretsClient,
          channelId: SLACK_CHANNEL_ID,
          messagePrefix: SLACK_MESSAGE_PREFIX,
        }

    const currentRoundId = Number(await getCurrentRoundId(thor, CONFIG.xAllocationVotingContractAddress))
    if (currentRoundId <= 1) {
      return buildResponse(SuccessResponseType.SUCCESS, {
        message: "No ended round available yet.",
      })
    }

    const endedRound = currentRoundId - 1
    const { challengeIds, totalEvents } = await getEndedChallengeIds(thor, CONFIG.challengesContractAddress, endedRound)

    if (challengeIds.length === 0) {
      logger.info("No challenges found for ended round", { endedRound, totalEvents })
      return buildResponse(SuccessResponseType.SUCCESS, {
        currentRoundId,
        endedRound,
        discoveredChallenges: 0,
      })
    }

    const { privateKey, walletAddress } = await getCallerWalletInfo()
    const queue = [...challengeIds]
    const finalizedChallengeIds = new Set<number>()
    const skippedChallengeIds = new Set<number>()
    const transactionIds: string[] = []
    const failedChallenges: Array<{ challengeId: number; reason: string; vmError?: string }> = []
    const attemptsByChallenge = new Map<number, number>()
    let processedBatches = 0

    while (queue.length > 0) {
      const challengeId = queue.shift() as number

      if (finalizedChallengeIds.has(challengeId) || skippedChallengeIds.has(challengeId)) {
        continue
      }

      const status = await getChallengeStatus(thor, CONFIG.challengesContractAddress, challengeId)
      if (
        status === ChallengeStatus.Finalized ||
        status === ChallengeStatus.Cancelled ||
        status === ChallengeStatus.Invalid
      ) {
        skippedChallengeIds.add(challengeId)
        continue
      }

      if (status !== ChallengeStatus.Active && status !== ChallengeStatus.Finalizing) {
        skippedChallengeIds.add(challengeId)
        continue
      }

      const attempts = (attemptsByChallenge.get(challengeId) ?? 0) + 1
      attemptsByChallenge.set(challengeId, attempts)

      if (attempts > MAX_BATCHES_PER_CHALLENGE) {
        failedChallenges.push({
          challengeId,
          reason: `Exceeded max batches per challenge (${MAX_BATCHES_PER_CHALLENGE})`,
        })
        continue
      }

      let finalizeResult: FinalizeBatchResult
      try {
        finalizeResult = await withRetry(
          () =>
            finalizeSingleBatch(
              thor,
              CONFIG.challengesContractAddress,
              challengeId,
              batchSize,
              walletAddress,
              privateKey,
              dryRun,
            ),
          3,
          2000,
          `Finalize challenge ${challengeId}`,
        )
      } catch (error) {
        failedChallenges.push({
          challengeId,
          reason: error instanceof Error ? error.message : String(error),
        })
        continue
      }

      if (!finalizeResult.success) {
        failedChallenges.push({
          challengeId,
          reason: finalizeResult.reason ?? "Unknown finalization error",
          vmError: finalizeResult.vmError,
        })
        continue
      }

      processedBatches += 1
      if (finalizeResult.txId) {
        transactionIds.push(finalizeResult.txId)
      }

      if (dryRun) {
        continue
      }

      const updatedStatus = await getChallengeStatus(thor, CONFIG.challengesContractAddress, challengeId)

      if (updatedStatus === ChallengeStatus.Finalized) {
        finalizedChallengeIds.add(challengeId)
        continue
      }

      if (updatedStatus === ChallengeStatus.Active || updatedStatus === ChallengeStatus.Finalizing) {
        queue.push(challengeId)
        continue
      }

      if (updatedStatus === ChallengeStatus.Cancelled || updatedStatus === ChallengeStatus.Invalid) {
        skippedChallengeIds.add(challengeId)
        continue
      }

      failedChallenges.push({
        challengeId,
        reason: `Unexpected status ${updatedStatus} after finalization`,
      })
    }

    const responseData = {
      currentRoundId,
      endedRound,
      dryRun,
      batchSize,
      discoveredChallenges: challengeIds.length,
      matchedEvents: totalEvents,
      processedBatches,
      finalizedChallengeIds: Array.from(finalizedChallengeIds),
      skippedChallengeIds: Array.from(skippedChallengeIds),
      failedChallenges,
      transactionIds,
    }

    if (failedChallenges.length > 0) {
      await notify({
        level: finalizedChallengeIds.size > 0 ? "warn" : "error",
        message: `Challenge finalization completed with ${failedChallenges.length} failure(s) for round ${endedRound}.`,
        data: responseData,
        slack: slackOptions,
      })
    } else if (!dryRun && processedBatches > 0) {
      await notify({
        level: "success",
        message: `Challenge finalization completed for round ${endedRound}.`,
        data: responseData,
        slack: slackOptions,
      })
    }

    if (failedChallenges.length > 0 && finalizedChallengeIds.size === 0 && processedBatches === 0) {
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, responseData)
    }

    return buildResponse(SuccessResponseType.SUCCESS, responseData)
  } catch (error) {
    logger.error("finalizeChallenges lambda failed", error, {
      environment: process.env.LAMBDA_ENV ?? AppEnv.TESTNET_STAGING,
    })

    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
