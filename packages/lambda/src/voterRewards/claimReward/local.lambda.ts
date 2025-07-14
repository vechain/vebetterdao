import path from "path"
import dotenv from "dotenv"

import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, Mnemonic, Transaction } from "@vechain/sdk-core"

import { VoterRewards__factory } from "@repo/contracts/typechain-types"
import localConfig from "@repo/config/local"
import { getConfig } from "@repo/config"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })

const NODE_URL = getConfig("local").nodeUrl

interface UserReward {
  voter: string
  cycle: number
  reward: string
  gmReward: string
  totalReward: string
}

interface ClaimResult {
  voter: string
  cycle: number
  success: boolean
  txId?: string
  error?: string
  gasUsed?: string
}

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = (): { walletAddress: string; privateKey: string } => {
  const PHRASE = process.env.MNEMONIC?.split(" ")
  if (!PHRASE) {
    throw new Error("Mnemonic not found")
  }

  const privateKey = Buffer.from(Mnemonic.toPrivateKey(PHRASE, "m/0")).toString("hex")
  const walletAddress = Address.ofPrivateKey(Mnemonic.toPrivateKey(PHRASE)).toString()

  return { walletAddress, privateKey }
}

/**
 * Claims rewards for a voter in a specific cycle.
 * @param cycle - The cycle number to claim rewards for.
 * @param voter - The address of the voter to claim rewards for.
 * @returns An object containing the transaction receipt and gas result.
 */
// todo - make this dynamic for testnet and mainnet
const claimRewardLocal = async (
  thor: ThorClient,
  cycle: number,
  voter: string,
): Promise<{ receipt: any; gasResult: any }> => {
  const { walletAddress, privateKey } = getCallerWalletInfo()

  const clause = Clause.callFunction(
    Address.of(localConfig.voterRewardsContractAddress),
    ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("claimReward"),
    [cycle, voter],
  )

  const gasResult = await thor.gas.estimateGas([clause], walletAddress)
  if (gasResult.reverted) {
    console.error("Txn (Gas) reverted:", gasResult.revertReasons, gasResult.vmErrors)
    throw new Error(`Txn (Gas) reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }

  const txBody = await thor.transactions.buildTransactionBody([clause], gasResult.totalGas)
  const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}

/**
 * Gets the reward amount for a voter in a specific cycle (view function).
 * @param thor - The ThorClient instance.
 * @param cycle - The cycle number to check rewards for.
 * @param voter - The address of the voter to check rewards for.
 * @returns The reward amount.
 */
export const getReward = async (thor: ThorClient, cycle: number, voter: string): Promise<string> => {
  const res = await thor.transactions.executeCall(
    localConfig.voterRewardsContractAddress,
    ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("getReward"),
    [cycle, voter],
  )

  if (!res.success) {
    throw new Error(`Failed to get reward for voter: ${voter} in cycle: ${cycle}`)
  }

  return res.result?.array?.[0] as string
}

/**
 * Gets the GM reward amount for a voter in a specific cycle (view function).
 * @param thor - The ThorClient instance.
 * @param cycle - The cycle number to check GM rewards for.
 * @param voter - The address of the voter to check GM rewards for.
 * @returns The GM reward amount.
 */
export const getGMReward = async (thor: ThorClient, cycle: number, voter: string): Promise<string> => {
  const res = await thor.transactions.executeCall(
    localConfig.voterRewardsContractAddress,
    ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("getGMReward"),
    [cycle, voter],
  )

  if (!res.success) {
    throw new Error(`Failed to get GM reward for voter: ${voter} in cycle: ${cycle}`)
  }

  return res.result?.array?.[0] as string
}

/**
 * Gets both reward types for a user in a specific cycle.
 * @param thor - The ThorClient instance.
 * @param cycle - The cycle number to check rewards for.
 * @param voter - The address of the voter to check rewards for.
 * @returns UserReward object with all reward information.
 */
const getUserRewards = async (thor: ThorClient, cycle: number, voter: string): Promise<UserReward> => {
  const [reward, gmReward] = await Promise.all([getReward(thor, cycle, voter), getGMReward(thor, cycle, voter)])

  const totalReward = (BigInt(reward) + BigInt(gmReward)).toString()

  return {
    voter,
    cycle,
    reward,
    gmReward,
    totalReward,
  }
}

/**
 * Batch check rewards for multiple users using concurrent calls (up to 10 users per batch).
 * Note: For read operations, concurrent calls are more efficient than clauses.
 * @param thor - The ThorClient instance.
 * @param users - Array of objects with voter address and cycle.
 * @returns Array of UserReward objects.
 */
const batchCheckRewards = async (
  thor: ThorClient,
  users: Array<{ voter: string; cycle: number }>,
): Promise<UserReward[]> => {
  console.log(`Checking rewards for ${users.length} users using batched concurrent calls...`)

  const results: UserReward[] = []
  const BATCH_SIZE = 10 // Max 10 users per batch for optimal performance

  // Process users in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE)
    console.log(
      `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)} (${batch.length} users)`,
    )

    try {
      const batchResults = await batchCheckRewardsWithClauses(thor, batch)
      results.push(...batchResults)
    } catch (error) {
      console.error(`✗ Failed to process batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)

      // Fallback to individual calls for this batch
      console.log("Falling back to individual calls for this batch...")
      for (const { voter, cycle } of batch) {
        try {
          const userReward = await getUserRewards(thor, cycle, voter)
          results.push(userReward)

          const hasRewards = BigInt(userReward.totalReward) > 0n
          console.log(`✓ ${voter} (cycle ${cycle}): ${hasRewards ? userReward.totalReward : "No rewards"}`)
        } catch (individualError) {
          console.error(`✗ Failed to check rewards for ${voter} in cycle ${cycle}:`, individualError)
          results.push({
            voter,
            cycle,
            reward: "0",
            gmReward: "0",
            totalReward: "0",
          })
        }
      }
    }
  }

  return results
}

/**
 * Batch check rewards for multiple users using concurrent calls (up to 10 users).
 * Note: For read operations, concurrent calls are more efficient than clauses.
 * Clauses are primarily for write operations that need to be atomic.
 * @param thor - The ThorClient instance.
 * @param users - Array of objects with voter address and cycle (max 10 users).
 * @returns Array of UserReward objects.
 */
const batchCheckRewardsWithClauses = async (
  thor: ThorClient,
  users: Array<{ voter: string; cycle: number }>,
): Promise<UserReward[]> => {
  if (users.length === 0) {
    return []
  }

  if (users.length > 10) {
    throw new Error("Cannot batch more than 10 users in a single call")
  }

  try {
    console.log(`Executing ${users.length * 2} concurrent calls for ${users.length} users`)

    // Create concurrent calls for both getReward and getGMReward for each user
    const rewardPromises = users.map(({ voter, cycle }) =>
      Promise.all([
        thor.transactions.executeCall(
          localConfig.voterRewardsContractAddress,
          ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("getReward"),
          [cycle, voter],
        ),
        thor.transactions.executeCall(
          localConfig.voterRewardsContractAddress,
          ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("getGMReward"),
          [cycle, voter],
        ),
      ]).then(([rewardResult, gmRewardResult]) => ({
        voter,
        cycle,
        rewardResult,
        gmRewardResult,
      })),
    )

    // Execute all calls concurrently
    const results = await Promise.all(rewardPromises)

    // Parse results
    const userRewards: UserReward[] = []
    results.forEach(({ voter, cycle, rewardResult, gmRewardResult }) => {
      try {
        const reward = rewardResult.success ? (rewardResult.result?.array?.[0] as string) || "0" : "0"
        const gmReward = gmRewardResult.success ? (gmRewardResult.result?.array?.[0] as string) || "0" : "0"
        const totalReward = (BigInt(reward) + BigInt(gmReward)).toString()

        userRewards.push({
          voter,
          cycle,
          reward,
          gmReward,
          totalReward,
        })

        const hasRewards = BigInt(totalReward) > 0n
        console.log(`✓ ${voter} (cycle ${cycle}): ${hasRewards ? totalReward : "No rewards"}`)
      } catch (parseError) {
        console.error(`✗ Failed to parse results for ${voter} in cycle ${cycle}:`, parseError)
        userRewards.push({
          voter,
          cycle,
          reward: "0",
          gmReward: "0",
          totalReward: "0",
        })
      }
    })

    return userRewards
  } catch (error) {
    console.error("Batch check with concurrent calls failed:", error)
    throw error
  }
}

/**
 * Batch claim rewards for multiple users.
 * @param thor - The ThorClient instance.
 * @param users - Array of objects with voter address and cycle.
 * @param delayMs - Delay between transactions in milliseconds (default: 1000ms).
 * @param onlyWithRewards - Only claim for users who have rewards (default: true).
 * @returns Array of ClaimResult objects.
 */
const batchClaimRewards = async (
  thor: ThorClient,
  users: Array<{ voter: string; cycle: number }>,
  delayMs: number = 1000,
  onlyWithRewards: boolean = true,
): Promise<ClaimResult[]> => {
  console.log(`Starting batch claim for ${users.length} users...`)

  // First, check rewards for all users if filtering is enabled
  let usersToProcess = users
  if (onlyWithRewards) {
    console.log("Checking rewards first...")
    const rewardChecks = await batchCheckRewards(thor, users)
    usersToProcess = rewardChecks.filter(r => BigInt(r.totalReward) > 0n).map(r => ({ voter: r.voter, cycle: r.cycle }))

    console.log(`Found ${usersToProcess.length} users with rewards to claim`)
  }

  const results: ClaimResult[] = []

  for (let i = 0; i < usersToProcess.length; i++) {
    const { voter, cycle } = usersToProcess[i]

    try {
      console.log(`[${i + 1}/${usersToProcess.length}] Claiming rewards for ${voter} (cycle ${cycle})...`)

      const result = await claimRewardLocal(thor, cycle, voter)

      results.push({
        voter,
        cycle,
        success: true,
        txId: result.receipt.meta.txID,
        gasUsed: result.gasResult.totalGas.toString(),
      })

      console.log(`✓ Success! TX: ${result.receipt.meta.txID}`)

      // Add delay between transactions to avoid overwhelming the network
      if (i < usersToProcess.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error(`✗ Failed to claim rewards for ${voter} in cycle ${cycle}:`, error)

      results.push({
        voter,
        cycle,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

/**
 * Batch claim rewards for multiple users using a single transaction with multiple clauses.
 * This is more efficient than individual transactions but all claims must succeed together.
 * @param thor - The ThorClient instance.
 * @param users - Array of objects with voter address and cycle.
 * @param onlyWithRewards - Only claim for users who have rewards (default: true).
 * @returns Object with transaction result and individual user results.
 */
const batchClaimRewardsWithClauses = async (
  thor: ThorClient,
  users: Array<{ voter: string; cycle: number }>,
  onlyWithRewards: boolean = true,
): Promise<{
  txId: string
  gasUsed: string
  totalClauses: number
  users: Array<{ voter: string; cycle: number }>
  success: boolean
  error?: string
}> => {
  console.log(`Starting batch claim with clauses for ${users.length} users...`)

  // First, check rewards for all users if filtering is enabled
  let usersToProcess = users
  if (onlyWithRewards) {
    console.log("Checking rewards first...")
    const rewardChecks = await batchCheckRewards(thor, users)
    usersToProcess = rewardChecks.filter(r => BigInt(r.totalReward) > 0n).map(r => ({ voter: r.voter, cycle: r.cycle }))

    console.log(`Found ${usersToProcess.length} users with rewards to claim`)
  }

  if (usersToProcess.length === 0) {
    console.log("No users with rewards to claim")
    return {
      txId: "",
      gasUsed: "0",
      totalClauses: 0,
      users: [],
      success: true,
    }
  }

  try {
    const { walletAddress, privateKey } = getCallerWalletInfo()

    // Create clauses for each user
    const clauses = usersToProcess.map(({ voter, cycle }) => {
      return Clause.callFunction(
        Address.of(localConfig.voterRewardsContractAddress),
        ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("claimReward"),
        [cycle, voter],
      )
    })

    console.log(`Created ${clauses.length} clauses for batch transaction`)

    // Estimate gas for all clauses
    const gasResult = await thor.gas.estimateGas(clauses, walletAddress)
    if (gasResult.reverted) {
      console.error("Batch txn (Gas) reverted:", gasResult.revertReasons, gasResult.vmErrors)
      throw new Error(`Batch txn (Gas) reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
    }

    console.log(`Estimated gas: ${gasResult.totalGas}`)

    // Build and send transaction
    const txBody = await thor.transactions.buildTransactionBody(clauses, gasResult.totalGas)
    const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
    const tx = await thor.transactions.sendTransaction(signedTx)
    const receipt = await thor.transactions.waitForTransaction(tx.id)

    if (!receipt?.meta?.txID) {
      throw new Error("Transaction receipt is missing or invalid")
    }

    console.log(`✓ Batch transaction successful! TX: ${receipt.meta.txID}`)
    console.log(`✓ Claimed rewards for ${usersToProcess.length} users in single transaction`)

    return {
      txId: receipt.meta.txID,
      gasUsed: gasResult.totalGas.toString(),
      totalClauses: clauses.length,
      users: usersToProcess,
      success: true,
    }
  } catch (error) {
    console.error(`✗ Batch transaction failed:`, error)

    return {
      txId: "",
      gasUsed: "0",
      totalClauses: 0,
      users: usersToProcess,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Print summary of batch claim results.
 * @param results - Array of ClaimResult objects.
 */
const printClaimSummary = (results: ClaimResult[]): void => {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log("\n=== BATCH CLAIM SUMMARY ===")
  console.log(`Total processed: ${results.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log("\nFailed claims:")
    failed.forEach(f => {
      console.log(`  ✗ ${f.voter} (cycle ${f.cycle}): ${f.error}`)
    })
  }

  if (successful.length > 0) {
    console.log("\nSuccessful claims:")
    successful.forEach(s => {
      console.log(`  ✓ ${s.voter} (cycle ${s.cycle}): ${s.txId}`)
    })
  }
}

// Main execution function with error handling
const main = async () => {
  try {
    const thor = ThorClient.at(NODE_URL, { isPollingEnabled: false })

    const cycleInput = process.argv[2]
    if (!cycleInput) {
      throw new Error("Cycle input is required")
    }
    const cycle = parseInt(cycleInput)

    // Example usage - replace with actual values
    const usersToCheck = [
      { voter: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa", cycle },
      { voter: "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68", cycle },
      { voter: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", cycle },
      // Add more users as needed
    ]

    console.log("=== VOTER REWARDS BATCH CLAIM ===")

    // Option 1: Check rewards for all users using batched concurrent calls (10 per batch)
    // Note: For read operations, concurrent calls are used instead of clauses for optimal performance
    console.log("\n1. Checking rewards for all users (batched concurrent calls)...")
    const startTime = Date.now()
    const rewardChecks = await batchCheckRewards(thor, usersToCheck)
    const endTime = Date.now()
    console.log(rewardChecks)
    console.log(`✓ Reward checking completed in ${endTime - startTime}ms`)

    // Option 2: Batch claim rewards using individual transactions (with delays)
    // console.log("\n2. Batch claiming rewards with individual transactions...")
    // const claimResults = await batchClaimRewards(thor, usersToCheck, 1000, true)
    // printClaimSummary(claimResults)

    // Option 3: Batch claim rewards using single transaction with multiple clauses
    // console.log("\n3. Batch claiming rewards with single transaction (clauses)...")
    // const clauseResult = await batchClaimRewardsWithClauses(thor, usersToCheck, true)

    // if (clauseResult.success) {
    //   console.log(`✓ Batch claim successful!`)
    //   console.log(`  TX ID: ${clauseResult.txId}`)
    //   console.log(`  Gas Used: ${clauseResult.gasUsed}`)
    //   console.log(`  Total Clauses: ${clauseResult.totalClauses}`)
    //   console.log(`  Users Processed: ${clauseResult.users.length}`)
    // } else {
    //   console.log(`✗ Batch claim failed: ${clauseResult.error}`)
    // }
  } catch (error) {
    console.error("Error executing batch claim:", error)
    throw error
  }
}

// Execute main function if this script is run directly
if (require.main === module) {
  main()
    .then(() => console.log("Process completed successfully"))
    .catch(error => {
      console.error("Process failed:", error)
      process.exit(1)
    })
}

// Export for external use
export {
  claimRewardLocal,
  batchClaimRewards,
  batchClaimRewardsWithClauses,
  batchCheckRewards,
  batchCheckRewardsWithClauses,
  getUserRewards,
  printClaimSummary,
  main,
}
