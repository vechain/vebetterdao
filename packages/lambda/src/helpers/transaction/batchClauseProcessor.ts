import { ThorClient } from "@vechain/sdk-network"
import { Clause, Transaction } from "@vechain/sdk-core"
import { buildGasEstimate, buildTxBody } from "../transaction"
import { logger } from "../logger"

/**
 * Represents an execution that failed
 */
export interface FailedExecution<T = string> {
  item: T
  reason: string
  vmError?: string
}

/**
 * Result of processing all batched executions
 */
export interface BatchResult<T = string> {
  successfulExecutions: number
  failedExecutions: FailedExecution<T>[]
  transactionIds: string[]
}

/**
 * Result of simulating a single execution
 */
interface SimulationResult {
  success: boolean
  reason?: string
  vmError?: string
}

/**
 * Simulates a single clause to check if it would succeed
 * @returns SimulationResult with success status and error details if failed
 */
const simulateSingleClause = async (
  thor: ThorClient,
  clause: Clause,
  walletAddress: string,
): Promise<SimulationResult> => {
  try {
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
 * Isolates failed executions from a batch by testing each individually
 * @returns Object with items to retry and items that definitely failed
 */
export const isolateFailedExecutions = async <T>(
  thor: ThorClient,
  items: T[],
  clauseBuilder: (item: T) => Clause,
  walletAddress: string,
): Promise<{ toRetry: T[]; definitelyFailed: FailedExecution<T>[] }> => {
  logger.info("Isolating failed executions", { itemsToTest: items.length })

  const toRetry: T[] = []
  const definitelyFailed: FailedExecution<T>[] = []

  for (const item of items) {
    const clause = clauseBuilder(item)
    const result = await simulateSingleClause(thor, clause, walletAddress)

    if (result.success) {
      toRetry.push(item)
    } else {
      definitelyFailed.push({
        item,
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
 * Processes a single batch of clauses
 * @returns Success status and transaction ID if successful
 */
const processSingleBatch = async (
  thor: ThorClient,
  clauses: Clause[],
  walletAddress: string,
  privateKey: string | Uint8Array,
  batchNumber: number,
  dryRun: boolean = false,
): Promise<{ success: boolean; txId?: string; needsIsolation?: boolean }> => {
  try {
    const gasResult = await buildGasEstimate(thor, clauses, walletAddress)

    if (gasResult.reverted) {
      logger.warn("Batch failed gas estimation", {
        batchNumber,
        clausesCount: clauses.length,
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
        clausesCount: clauses.length,
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
        clausesCount: clauses.length,
        txId: tx.id,
      })
      return { success: true, txId: tx.id }
    } else {
      logger.warn("Batch transaction reverted", { batchNumber, txId: tx.id })
      return { success: false, needsIsolation: true }
    }
  } catch (error) {
    logger.error("Batch processing error", error, { batchNumber, clausesCount: clauses.length, dryRun })
    return { success: false, needsIsolation: true }
  }
}

/**
 * Processes all items in batches and handles failures gracefully
 * @param thor - The ThorClient instance
 * @param items - Array of items to process (e.g., user addresses)
 * @param clauseBuilder - Function that converts an item to a Clause
 * @param walletAddress - The wallet address to use for signing
 * @param privateKey - The private key for signing (as hex string or Uint8Array)
 * @param batchSize - Size of each batch (default: 10)
 * @param dryRun - If true, only simulate without sending transactions (default: false)
 * @returns BatchResult with counts and failure details
 */
export const processBatchedClauses = async <T>(
  thor: ThorClient,
  items: T[],
  clauseBuilder: (item: T) => Clause,
  walletAddress: string,
  privateKey: string | Uint8Array,
  batchSize: number = 10,
  dryRun: boolean = false,
): Promise<BatchResult<T>> => {
  logger.info("Starting batched clause processing", {
    totalItems: items.length,
    batchSize,
    dryRun,
  })

  const queue = [...items] // Create a copy to work with
  const failedExecutions: FailedExecution<T>[] = []
  const transactionIds: string[] = []
  let successfulExecutions = 0
  let batchNumber = 0

  while (queue.length > 0) {
    batchNumber++
    const batch = queue.splice(0, batchSize)
    const clauses = batch.map(clauseBuilder)

    const result = await processSingleBatch(thor, clauses, walletAddress, privateKey, batchNumber, dryRun)

    if (result.success && result.txId) {
      transactionIds.push(result.txId)
      successfulExecutions += batch.length
    } else if (result.needsIsolation) {
      // Batch failed, need to isolate which items are bad
      const { toRetry, definitelyFailed } = await isolateFailedExecutions(thor, batch, clauseBuilder, walletAddress)

      // Add failed executions to our tracking list
      failedExecutions.push(...definitelyFailed)

      // Add items that passed simulation back to the front of the queue
      if (toRetry.length > 0) {
        logger.info("Adding items back to queue for retry", { count: toRetry.length })
        queue.unshift(...toRetry)
      }
    }
  }

  logger.info("Batch processing complete", {
    successfulExecutions,
    failedExecutionsCount: failedExecutions.length,
    totalTransactions: transactionIds.length,
    dryRun,
    failedExecutions: failedExecutions.length > 0 ? failedExecutions : undefined,
  })

  return {
    successfulExecutions,
    failedExecutions,
    transactionIds,
  }
}
