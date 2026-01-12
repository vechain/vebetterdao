import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import {
  processBatchedClauses,
  isolateFailedExecutions,
  FailedExecution,
  BatchResult,
} from "../transaction/batchClauseProcessor"

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
export interface VoteBatchResult {
  successfulVotes: number
  failedVotes: FailedVote[]
  transientFailures: FailedVote[]
  transactionIds: string[]
}

/**
 * Builds a clause for casting a vote on behalf of a user
 */
const buildCastVoteClause =
  (contractAddress: string, roundId: number) =>
  (user: string): Clause => {
    return Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVoteOnBehalfOf"),
      [user, roundId],
    )
  }

/**
 * Converts generic BatchResult to VoteBatchResult
 */
const convertBatchResult = (result: BatchResult<string>): VoteBatchResult => {
  return {
    successfulVotes: result.successfulExecutions,
    failedVotes: result.failedExecutions.map(fe => ({
      user: fe.item,
      reason: fe.reason,
      vmError: fe.vmError,
    })),
    transientFailures: result.transientFailures.map(fe => ({
      user: fe.item,
      reason: fe.reason,
      vmError: fe.vmError,
    })),
    transactionIds: result.transactionIds,
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
  const clauseBuilder = buildCastVoteClause(contractAddress, roundId)
  const result = await isolateFailedExecutions(thor, users, clauseBuilder, walletAddress)

  return {
    toRetry: result.toRetry,
    definitelyFailed: result.definitelyFailed.map(fe => ({
      user: fe.item,
      reason: fe.reason,
      vmError: fe.vmError,
    })),
  }
}

/**
 * Processes all votes in batches and handles failures gracefully
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param users - Array of user addresses to vote on behalf of
 * @param roundId - The round ID to cast votes for
 * @param walletAddress - The wallet address to use for signing
 * @param privateKey - The private key for signing (as hex string or Uint8Array)
 * @param batchSize - Size of each batch (default: 10)
 * @param dryRun - If true, only simulate votes without sending transactions (default: false)
 * @param maxRetries - Maximum number of retries per vote (default: 3)
 * @returns VoteBatchResult with counts and failure details
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
  maxRetries: number = 3,
): Promise<VoteBatchResult> => {
  const clauseBuilder = buildCastVoteClause(contractAddress, roundId)

  const result = await processBatchedClauses(
    thor,
    users,
    clauseBuilder,
    walletAddress,
    privateKey,
    batchSize,
    dryRun,
    maxRetries,
  )

  return convertBatchResult(result)
}
