import { ThorClient } from "@vechain/sdk-network"
import { Clause, Transaction } from "@vechain/sdk-core"
import { buildGasEstimate, buildTxBody } from "../transaction"
import { logger } from "../logger"

/**
 * Delay between operations to prevent rate limiting (in milliseconds)
 */
const ISOLATION_DELAY_MS = 20
const BATCH_DELAY_MS = 100

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
  transientFailures: FailedExecution<T>[]
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
  gasPadding: number = 0.1, // 10% padding
): Promise<SimulationResult> => {
  try {
    const gasResult = await thor.gas.estimateGas([clause], walletAddress, { gasPadding })

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

    // Add delay between simulations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, ISOLATION_DELAY_MS))
  }

  logger.info("Isolation complete", {
    toRetry: toRetry.length,
    definitelyFailed: definitelyFailed.length,
  })

  return { toRetry, definitelyFailed }
}

/**
 * Processes a single batch of clauses
 * @returns Success status and transaction ID if successful, or error details if failed
 */
const processSingleBatch = async (
  thor: ThorClient,
  clauses: Clause[],
  walletAddress: string,
  privateKey: string | Uint8Array,
  batchNumber: number,
  dryRun: boolean = false,
): Promise<{ success: boolean; txId?: string; needsIsolation?: boolean; error?: string }> => {
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
      return { success: false, needsIsolation: true, error: "Gas estimation failed" }
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
      return { success: false, needsIsolation: true, error: "Receipt not found" }
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
      return { success: false, needsIsolation: true, error: "Transaction reverted" }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error("Batch processing error", error, { batchNumber, clausesCount: clauses.length, dryRun })
    return { success: false, needsIsolation: true, error: errorMessage }
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
 * @param maxRetries - Maximum number of total attempts (default: 3)
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
  maxRetries: number = 3,
): Promise<BatchResult<T>> => {
  // Validate batch size
  if (batchSize <= 0) {
    throw new Error(`Invalid batchSize: ${batchSize}. Must be greater than 0.`)
  }

  // Validate max retries
  if (maxRetries < 0) {
    throw new Error(`Invalid maxRetries: ${maxRetries}. Must be 0 or greater.`)
  }

  logger.info("Starting batched clause processing", {
    totalItems: items.length,
    batchSize,
    dryRun,
    maxRetries,
  })

  const queue = [...items] // Create a copy to work with
  const failedExecutions: FailedExecution<T>[] = []
  const transientFailures: FailedExecution<T>[] = []
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
      let toRetry: T[] = []
      let definitelyFailed: FailedExecution<T>[] = []

      try {
        const isolationResult = await isolateFailedExecutions(thor, batch, clauseBuilder, walletAddress)
        toRetry = isolationResult.toRetry
        definitelyFailed = isolationResult.definitelyFailed
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error("Isolation process failed", error, { batchNumber, batchSize: batch.length })

        // If isolation fails completely, mark all items as failed
        definitelyFailed = batch.map(item => ({
          item,
          reason: `Isolation failed: ${errorMessage}`,
        }))
      }

      // Add failed executions to tracking list
      failedExecutions.push(...definitelyFailed)

      // Process verified items IMMEDIATELY (no queue, no mixing with untested items)
      if (toRetry.length > 0) {
        logger.info("Processing verified items immediately", {
          verifiedCount: toRetry.length,
          permanentFailures: definitelyFailed.length,
        })

        let remainingItems = toRetry
        let attemptNumber = 0

        // Retry loop for verified items
        while (remainingItems.length > 0 && attemptNumber < maxRetries - 1) {
          const verifiedClauses = remainingItems.map(clauseBuilder)
          const verifiedResult = await processSingleBatch(
            thor,
            verifiedClauses,
            walletAddress,
            privateKey,
            batchNumber,
            dryRun,
          )

          if (verifiedResult.success && verifiedResult.txId) {
            // All verified items processed
            logger.info("Verified items processed successfully", {
              count: remainingItems.length,
              attemptNumber,
              totalAttempts: attemptNumber + 1,
            })
            transactionIds.push(verifiedResult.txId)
            successfulExecutions += remainingItems.length
            remainingItems = [] // Done
          } else {
            // RPC/network issue - retry (no re-isolation needed)
            attemptNumber++
            logger.warn("Verified items processing failed, retrying", {
              count: remainingItems.length,
              attemptNumber,
              maxRetries,
              error: verifiedResult.error,
            })

            // Brief delay before retry to give node time to recover
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
          }
        }

        // If items still remain after all retries, mark as transient failures
        if (remainingItems.length > 0) {
          logger.error("Verified items failed after max retries", {
            count: remainingItems.length,
            maxRetries,
            totalAttempts: maxRetries,
            lastError: "Exhausted all retry attempts",
          })
          remainingItems.forEach(item => {
            transientFailures.push({
              item,
              reason: `Transient failure after ${maxRetries} attempts: Unknown RPC/network error`,
            })
          })
        }
      }
    } else {
      // Handle unexpected state
      logger.error("Unexpected batch result state", undefined, {
        result,
        batchNumber,
        itemCount: batch.length,
      })
      batch.forEach(item => {
        failedExecutions.push({
          item,
          reason: result.error || "Unexpected failure without isolation",
        })
      })
    }
  }

  logger.info("Batch processing complete", {
    successfulExecutions,
    failedExecutionsCount: failedExecutions.length,
    transientFailuresCount: transientFailures.length,
    totalTransactions: transactionIds.length,
    dryRun,
  })

  return {
    successfulExecutions,
    failedExecutions,
    transientFailures,
    transactionIds,
  }
}
