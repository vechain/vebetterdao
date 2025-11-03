import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause } from "@vechain/sdk-core"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { processBatchedClauses, isolateFailedExecutions, BatchResult } from "../transaction/batchClauseProcessor"

/**
 * Represents a claim that failed to be processed
 */
export interface FailedClaim {
  user: string
  reason: string
  vmError?: string
}

/**
 * Result of processing all batched claims
 */
export interface ClaimBatchResult {
  successfulClaims: number
  failedClaims: FailedClaim[]
  transactionIds: string[]
}

/**
 * Builds a clause for claiming rewards on behalf of a user
 */
const buildClaimRewardClause =
  (contractAddress: string, roundId: number) =>
  (user: string): Clause => {
    return Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("claimReward"),
      [roundId, user],
    )
  }

/**
 * Converts generic BatchResult to ClaimBatchResult
 */
const convertBatchResult = (result: BatchResult<string>): ClaimBatchResult => {
  return {
    successfulClaims: result.successfulExecutions,
    failedClaims: result.failedExecutions.map(fe => ({
      user: fe.item,
      reason: fe.reason,
      vmError: fe.vmError,
    })),
    transactionIds: result.transactionIds,
  }
}

/**
 * Isolates failed claims from a batch by testing each individually
 * Can also be used standalone to simulate claims without submitting transactions
 * @returns Object with claims to retry and claims that definitely failed
 */
export const isolateFailedClaims = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  cycle: number,
  walletAddress: string,
): Promise<{ toRetry: string[]; definitelyFailed: FailedClaim[] }> => {
  const clauseBuilder = buildClaimRewardClause(contractAddress, cycle)
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
 * Processes all claims in batches and handles failures gracefully
 * @param thor - The ThorClient instance
 * @param contractAddress - The VoterRewards contract address
 * @param users - Array of user addresses to claim rewards on behalf of
 * @param roundId - The round ID to claim rewards for
 * @param walletAddress - The wallet address to use for signing
 * @param privateKey - The private key for signing (as hex string or Uint8Array)
 * @param batchSize - Size of each batch (default: 10)
 * @param dryRun - If true, only simulate claims without sending transactions (default: false)
 * @param maxRetries - Maximum number of retries per claim (default: 3)
 * @returns ClaimBatchResult with counts and failure details
 */
export const processBatchedClaims = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  roundId: number,
  walletAddress: string,
  privateKey: string | Uint8Array,
  batchSize: number = 10,
  dryRun: boolean = false,
  maxRetries: number = 3,
): Promise<ClaimBatchResult> => {
  const clauseBuilder = buildClaimRewardClause(contractAddress, roundId)

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
