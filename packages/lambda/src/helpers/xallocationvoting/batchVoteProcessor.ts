import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { buildGasEstimate, buildTxBody } from "../transaction"
import { logger } from "../logger"

/**
 * Represents a vote that failed to be cast
 */
export interface FailedVote {
  user: string
  reason: string
  vmError?: string
}

/**
 * Result of processing all batched votes
 */
export interface BatchResult {
  successfulVotes: number
  failedVotes: FailedVote[]
  transactionIds: string[]
}

/**
 * Result of simulating a single vote
 */
interface SimulationResult {
  success: boolean
  reason?: string
  vmError?: string
}

/**
 * Builds clauses for a batch of users
 */
const buildBatchClauses = (contractAddress: string, users: string[], roundId: number): Clause[] => {
  return users.map(user =>
    Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVoteOnBehalfOf"),
      [user, roundId],
    ),
  )
}

/**
 * Simulates a single vote to check if it would succeed
 * @returns SimulationResult with success status and error details if failed
 */
const simulateSingleVote = async (
  thor: ThorClient,
  contractAddress: string,
  user: string,
  roundId: number,
  walletAddress: string,
): Promise<SimulationResult> => {
  try {
    const clause = buildBatchClauses(contractAddress, [user], roundId)[0]
    const gasResult = await thor.gas.estimateGas([clause], walletAddress)

    if (gasResult.reverted) {
      const reasonRaw = gasResult.revertReasons?.[0]
      const reason: string = reasonRaw ? String(reasonRaw) : "Unknown revert reason"
      const vmErrorRaw = gasResult.vmErrors?.[0]
      const vmError: string | undefined = vmErrorRaw !== undefined ? String(vmErrorRaw) : undefined
      return {
        success: false,
        reason,
        vmError,
      }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      reason: `Simulation error: ${errorMessage}`,
    }
  }
}

/**
 * Isolates failed votes from a batch by testing each individually
 * Can also be used standalone to simulate votes without submitting transactions
 * @returns Object with votes to retry and votes that definitely failed
 */
export const isolateFailedVotes = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  roundId: number,
  walletAddress: string,
): Promise<{ toRetry: string[]; definitelyFailed: FailedVote[] }> => {
  logger.info("Isolating failed votes", { usersToTest: users.length })

  const toRetry: string[] = []
  const definitelyFailed: FailedVote[] = []

  for (const user of users) {
    const result = await simulateSingleVote(thor, contractAddress, user, roundId, walletAddress)

    if (result.success) {
      toRetry.push(user)
    } else {
      definitelyFailed.push({
        user,
        reason: result.reason || "Unknown error",
        vmError: result.vmError,
      })
    }
  }

  logger.info("Isolation complete", {
    toRetry: toRetry.length,
    definitelyFailed: definitelyFailed.length,
  })

  return { toRetry, definitelyFailed }
}

/**
 * Processes a single batch of votes
 * @returns Success status and transaction ID if successful
 */
const processSingleBatch = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  roundId: number,
  walletAddress: string,
  privateKey: string | Uint8Array,
  batchNumber: number,
  dryRun: boolean = false,
): Promise<{ success: boolean; txId?: string; needsIsolation?: boolean }> => {
  try {
    const clauses = buildBatchClauses(contractAddress, users, roundId)
    const gasResult = await buildGasEstimate(thor, clauses, walletAddress)

    if (gasResult.reverted) {
      logger.warn("Batch failed gas estimation", {
        batchNumber,
        usersCount: users.length,
        revertReasons: gasResult.revertReasons,
        vmErrors: gasResult.vmErrors,
        dryRun,
      })
      return { success: false, needsIsolation: true }
    }

    // If dry run, stop here after successful gas estimation
    if (dryRun) {
      logger.info("Batch simulation successful (DRY RUN)", {
        batchNumber,
        votesCount: users.length,
        estimatedGas: gasResult.totalGas,
      })
      return { success: true, txId: `DRY_RUN_BATCH_${batchNumber}` }
    }

    const txBody = await buildTxBody(thor, clauses, gasResult.totalGas)
    const signedTx =
      typeof privateKey === "string"
        ? Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
        : Transaction.of(txBody).sign(privateKey)

    const tx = await thor.transactions.sendTransaction(signedTx)
    const receipt = await thor.transactions.waitForTransaction(tx.id)

    if (!receipt) {
      logger.warn("Batch receipt not found", { batchNumber, txId: tx.id })
      return { success: false, needsIsolation: true }
    }

    if (!receipt.reverted) {
      logger.info("Batch processed successfully", {
        batchNumber,
        votesCount: users.length,
        txId: tx.id,
      })
      return { success: true, txId: tx.id }
    } else {
      logger.warn("Batch transaction reverted", { batchNumber, txId: tx.id })
      return { success: false, needsIsolation: true }
    }
  } catch (error) {
    logger.error("Batch processing error", error, { batchNumber, usersCount: users.length, dryRun })
    return { success: false, needsIsolation: true }
  }
}

/**
 * Processes all votes in batches of 10 and handles failures gracefully
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param users - Array of user addresses to vote on behalf of
 * @param roundId - The round ID to cast votes for
 * @param walletAddress - The wallet address to use for signing
 * @param privateKey - The private key for signing (as hex string or Uint8Array)
 * @param batchSize - Size of each batch (default: 10)
 * @param dryRun - If true, only simulate votes without sending transactions (default: false)
 * @returns BatchResult with counts and failure details
 */
export const processBatchedVotes = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  roundId: number,
  walletAddress: string,
  privateKey: string | Uint8Array,
  batchSize: number = 10,
  dryRun: boolean = false,
): Promise<BatchResult> => {
  logger.info("Starting batched vote processing", {
    totalUsers: users.length,
    batchSize,
    roundId,
    dryRun,
  })

  const queue = [...users] // Create a copy to work with
  const failedVotes: FailedVote[] = []
  const transactionIds: string[] = []
  let successfulVotes = 0
  let batchNumber = 0

  while (queue.length > 0) {
    batchNumber++
    const batch = queue.splice(0, batchSize)

    const result = await processSingleBatch(
      thor,
      contractAddress,
      batch,
      roundId,
      walletAddress,
      privateKey,
      batchNumber,
      dryRun,
    )

    if (result.success && result.txId) {
      transactionIds.push(result.txId)
      successfulVotes += batch.length
    } else if (result.needsIsolation) {
      // Batch failed, need to isolate which votes are bad
      const { toRetry, definitelyFailed } = await isolateFailedVotes(
        thor,
        contractAddress,
        batch,
        roundId,
        walletAddress,
      )

      // Add failed votes to our tracking list
      failedVotes.push(...definitelyFailed)

      // Add votes that passed simulation back to the front of the queue
      if (toRetry.length > 0) {
        logger.info("Adding votes back to queue for retry", { count: toRetry.length })
        queue.unshift(...toRetry)
      }
    }
  }

  logger.info("Batch processing complete", {
    successfulVotes,
    failedVotesCount: failedVotes.length,
    totalTransactions: transactionIds.length,
    dryRun,
    failedVotes: failedVotes.length > 0 ? failedVotes : undefined,
  })

  return {
    successfulVotes,
    failedVotes,
    transactionIds,
  }
}
