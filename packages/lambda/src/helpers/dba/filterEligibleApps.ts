import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Revision } from "@vechain/sdk-core"
import {
  X2EarnApps__factory as X2EarnApps,
  XAllocationVoting__factory as XAllocationVoting,
  XAllocationPool__factory as XAllocationPool,
  X2EarnRewardsPool__factory as X2EarnRewardsPool,
} from "@vechain/vebetterdao-contracts"
import { AppConfig } from "@repo/config"

/**
 * Checks the endorsement status of an app during a round by querying contract state
 * at specific block numbers using the revision parameter.
 *
 * Strategy:
 * 1. Query isAppUnendorsed at the round start block (roundSnapshot)
 * 2. Query isAppUnendorsed at the round end block (roundDeadline)
 * 3. Compare the two states to determine if there were changes
 *
 * This approach is efficient (2 contract calls) and accurate (directly queries
 * blockchain state at specific blocks) without needing to parse events.
 *
 * @param thor - The ThorClient instance
 * @param config - The application configuration
 * @param roundId - The round ID to check
 * @param appId - The app ID to check
 * @returns Object with wasUnendorsedAtStart and hadEndorsementChanges flags
 */
async function getEndorsementStatusForRound(
  thor: ThorClient,
  config: AppConfig,
  roundId: number,
  appId: string,
): Promise<{ wasUnendorsedAtStart: boolean; hadEndorsementChanges: boolean }> {
  const votingContract = ABIContract.ofAbi(XAllocationVoting.abi as any)

  // Get round start and end blocks
  const roundStartRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    votingContract.getFunction("roundSnapshot"),
    [roundId],
  )

  const roundEndRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    votingContract.getFunction("roundDeadline"),
    [roundId],
  )

  if (!roundStartRes.success || !roundEndRes.success) {
    return { wasUnendorsedAtStart: false, hadEndorsementChanges: false }
  }

  const roundStartBlock = Number(roundStartRes.result?.array?.[0] ?? 0)
  const roundEndBlock = Number(roundEndRes.result?.array?.[0] ?? 0)

  console.log(
    `    Checking endorsement status for app ${appId} at round ${roundId} (blocks ${roundStartBlock}-${roundEndBlock})`,
  )

  // Query the endorsement status at the round start block
  const x2EarnAppsContract = ABIContract.ofAbi(X2EarnApps.abi as any)

  const unendorsedAtStartRes = await thor.contracts.executeCall(
    config.x2EarnAppsContractAddress,
    x2EarnAppsContract.getFunction("isAppUnendorsed"),
    [appId],
    { revision: Revision.of(roundStartBlock.toString()) },
  )

  // Query the endorsement status at the round end block
  const unendorsedAtEndRes = await thor.contracts.executeCall(
    config.x2EarnAppsContractAddress,
    x2EarnAppsContract.getFunction("isAppUnendorsed"),
    [appId],
    { revision: Revision.of(roundEndBlock.toString()) },
  )

  const wasUnendorsedAtStart = Boolean(unendorsedAtStartRes.result?.array?.[0] ?? false)
  const wasUnendorsedAtEnd = Boolean(unendorsedAtEndRes.result?.array?.[0] ?? false)

  // If the endorsement status changed during the round, there were changes
  const hadEndorsementChanges = wasUnendorsedAtStart !== wasUnendorsedAtEnd

  console.log(
    `    Status at start: ${wasUnendorsedAtStart ? "UNENDORSED" : "ENDORSED"}, at end: ${wasUnendorsedAtEnd ? "UNENDORSED" : "ENDORSED"}${hadEndorsementChanges ? " (CHANGED)" : " (no change)"}`,
  )

  return { wasUnendorsedAtStart, hadEndorsementChanges }
}

/**
 * Checks if an app had at least one RewardDistributed event during a round
 *
 * @param thor - The ThorClient instance
 * @param config - The application configuration
 * @param roundId - The round ID to check
 * @param appId - The app ID to check
 * @returns True if the app distributed at least one reward with proof during the round
 */
async function hasRewardedActions(
  thor: ThorClient,
  config: AppConfig,
  roundId: number,
  appId: string,
): Promise<boolean> {
  // Get round start and end blocks
  const votingContract = ABIContract.ofAbi(XAllocationVoting.abi as any)

  const roundStartRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    votingContract.getFunction("roundSnapshot"),
    [roundId],
  )

  console.log("Round started in block: ", roundStartRes.result?.array?.[0])

  const roundEndRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    votingContract.getFunction("roundDeadline"),
    [roundId],
  )

  if (!roundStartRes.success || !roundEndRes.success) {
    throw new Error("Failed to get round start/end blocks")
  }

  const roundStartBlock = Number(roundStartRes.result?.array?.[0] ?? 0)
  const roundEndBlock = Number(roundEndRes.result?.array?.[0] ?? 0)

  // Get the RewardDistributed event from the X2EarnRewardsPool contract
  const rewardsPoolContract = ABIContract.ofAbi(X2EarnRewardsPool.abi as any)
  const rewardEventAbi = rewardsPoolContract.getEvent("RewardDistributed")
  const topics = rewardEventAbi.encodeFilterTopicsNoNull({ appId })

  const logs = await thor.logs.filterEventLogs({
    range: {
      unit: "block" as const,
      from: roundStartBlock,
      to: roundEndBlock,
    },
    options: {
      offset: 0,
      limit: 256,
    },
    order: "asc",
    criteriaSet: [
      {
        criteria: {
          address: config.x2EarnRewardsPoolContractAddress,
          topic0: topics[0],
          topic1: topics[1],
        },
        eventAbi: rewardEventAbi,
      },
    ],
  })

  return logs.length > 0
}

/**
 * Filters apps to find those eligible for DBA rewards distribution.
 *
 * Eligibility criteria:
 * 1. App was eligible for voting in the round
 * 2. App rewarded at least 1 action with proofs during the round
 * 3. App received less than 7.5% of votes (750 in scaled format)
 * 4. App was fully endorsed during the round (not in grace period for entire round)
 *
 * @param thor - The ThorClient instance
 * @param config - The application configuration
 * @param roundId - The round ID to check
 * @returns Array of eligible app IDs
 */
export async function filterEligibleAppsForDBA(
  thor: ThorClient,
  config: AppConfig,
  roundId: number,
): Promise<string[]> {
  console.log(`Filtering eligible apps for DBA distribution in round ${roundId}`)

  // 1. Get all apps that participated in the round
  const appsRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    ABIContract.ofAbi(XAllocationVoting.abi as any).getFunction("getAppIdsOfRound"),
    [roundId],
  )

  if (!appsRes.success) {
    throw new Error("Failed to get apps for round")
  }

  const appsOfRound = (appsRes.result?.array?.[0] as string[]) || []
  console.log(`Found ${appsOfRound.length} apps in round ${roundId}`)

  if (appsOfRound.length === 0) {
    console.log("No apps found in round, returning empty array")
    return []
  }

  const eligibleApps: string[] = []

  // 2. Check each app for eligibility
  for (const appId of appsOfRound) {
    console.log(`Checking eligibility for app ${appId}`)

    // Check if app rewarded at least 1 action
    const hasRewarded = await hasRewardedActions(thor, config, roundId, appId)
    if (!hasRewarded) {
      console.log(`  - App ${appId} did not reward any actions, skipping`)
      continue
    }

    // Check app's vote share
    const sharesRes = await thor.contracts.executeCall(
      config.xAllocationPoolContractAddress,
      ABIContract.ofAbi(XAllocationPool.abi as any).getFunction("getAppShares"),
      [roundId, appId],
    )

    if (!sharesRes.success) {
      console.log(`  - Failed to get shares for app ${appId}, skipping`)
      continue
    }

    const appShare = Number(sharesRes.result?.array?.[0] ?? 0)
    const unallocatedShare = Number(sharesRes.result?.array?.[1] ?? 0)

    console.log(`  - App ${appId} has share: ${appShare}, unallocated: ${unallocatedShare}`)

    // Exclude apps with >= 7.5% votes (750 in scaled format where 100 = 1%)
    if (appShare >= 750) {
      console.log(`  - App ${appId} received >= 7.5% votes (${appShare / 100}%), skipping`)
      continue
    }

    // Check endorsement status at round start and during the round
    const { wasUnendorsedAtStart, hadEndorsementChanges } = await getEndorsementStatusForRound(
      thor,
      config,
      roundId,
      appId,
    )

    // Exclude apps that remained in grace period (unendorsed) for the entire round
    // An app is considered to have been in grace period for the entire round if:
    // - It was unendorsed at the round start block, AND
    // - It had no endorsement status changes during the round
    //
    // This means the app stayed unendorsed throughout the entire round duration.
    // Apps that became endorsed during the round (had changes) are eligible.
    if (wasUnendorsedAtStart && !hadEndorsementChanges) {
      console.log(`  - App ${appId} remained in grace period (unendorsed) for entire round, skipping`)
      continue
    }

    console.log(`  - App ${appId} is ELIGIBLE for DBA rewards`)
    eligibleApps.push(appId)
  }

  console.log(`Found ${eligibleApps.length} eligible apps for DBA distribution`)
  return eligibleApps
}
