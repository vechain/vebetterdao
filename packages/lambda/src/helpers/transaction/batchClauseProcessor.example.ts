/**
 * Example usage of the generic batchClauseProcessor
 *
 * This demonstrates how batchVoteProcessor.ts uses the generic batch clause processor
 * to handle voting operations. The same pattern can be applied to any contract operation.
 */

import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { processBatchedClauses } from "./batchClauseProcessor"

/**
 * Example: Batch casting votes on behalf of users
 *
 * This is the actual implementation from batchVoteProcessor.ts, showing how to use
 * the generic processBatchedClauses for a specific contract operation.
 */
export const exampleProcessBatchedVotes = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  roundId: number,
  walletAddress: string,
  privateKey: string,
  batchSize: number = 10,
  dryRun: boolean = false,
) => {
  // Step 1: Define how to build a clause for each user
  const buildCastVoteClause = (user: string): Clause => {
    return Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVoteOnBehalfOf"),
      [user, roundId],
    )
  }

  // Step 2: Use the generic batch processor
  const result = await processBatchedClauses(
    thor,
    users, // Array of items to process
    buildCastVoteClause, // Function to convert each item to a Clause
    walletAddress,
    privateKey,
    batchSize,
    dryRun,
  )

  // Step 3: Handle results
  console.log(`Successfully voted for ${result.successfulExecutions} users`)
  console.log(`Failed votes: ${result.failedExecutions.length}`)

  if (result.failedExecutions.length > 0) {
    console.log("\nFailed users:")
    result.failedExecutions.forEach(failure => {
      console.log(`  - ${failure.item}: ${failure.reason}`)
      if (failure.vmError) {
        console.log(`    VM Error: ${failure.vmError}`)
      }
    })
  }

  return {
    successfulVotes: result.successfulExecutions,
    failedVotes: result.failedExecutions.map(fe => ({
      user: fe.item,
      reason: fe.reason,
      vmError: fe.vmError,
    })),
    transactionIds: result.transactionIds,
  }
}

/**
 * To use this for other contract operations:
 *
 * 1. Define your clause builder function:
 *    const buildYourClause = (item: YourType): Clause => { ... }
 *
 * 2. Call processBatchedClauses with your items and builder:
 *    const result = await processBatchedClauses(thor, items, buildYourClause, ...)
 *
 * 3. The processor handles:
 *    - Batching (groups items into batches of specified size)
 *    - Gas estimation (validates each batch before sending)
 *    - Failure isolation (identifies which specific items fail)
 *    - Automatic retry (retries valid items from failed batches)
 *    - Dry-run mode (simulates without sending transactions)
 */
