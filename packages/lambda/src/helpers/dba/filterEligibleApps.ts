import { ThorClient } from "@vechain/sdk-network"
import { ABIContract } from "@vechain/sdk-core"
import {
  X2EarnApps__factory as X2EarnApps,
  XAllocationVoting__factory as XAllocationVoting,
  XAllocationPool__factory as XAllocationPool,
} from "@vechain/vebetterdao-contracts"
import { AppConfig } from "@repo/config"

/**
 * Checks if an app had endorsement changes during a round by looking for
 * AppEndorsementStatusUpdated events during the round's block range
 *
 * @param thor - The ThorClient instance
 * @param config - The application configuration
 * @param roundId - The round ID to check
 * @param appId - The app ID to check
 * @returns True if the app had endorsement status changes during the round
 */
async function hadEndorsementChangesDuringRound(
  thor: ThorClient,
  config: AppConfig,
  roundId: number,
  appId: string,
): Promise<boolean> {
  // Get round start and end blocks
  const votingContract = ABIContract.ofAbi(XAllocationVoting.abi as any)

  const roundStartRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    votingContract.getFunction("roundStart"),
    [roundId],
  )

  const roundEndRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    votingContract.getFunction("roundEnd"),
    [roundId],
  )

  if (!roundStartRes.success || !roundEndRes.success) {
    return false
  }

  const roundStartBlock = Number(roundStartRes.result?.array?.[0] ?? 0)
  const roundEndBlock = Number(roundEndRes.result?.array?.[0] ?? 0)

  // Get the AppEndorsementStatusUpdated events for this app during this round
  const x2EarnAppsContract = ABIContract.ofAbi(X2EarnApps.abi as any)
  const eventSignature = x2EarnAppsContract.getEvent("AppEndorsementStatusUpdated").signature

  const eventCriteria = {
    address: config.x2EarnAppsContractAddress,
    topic0: eventSignature,
    topic1: appId, // Filter by appId (indexed parameter)
    range: {
      unit: "block" as const,
      from: roundStartBlock,
      to: roundEndBlock,
    },
  }

  const logs = await thor.logs.filterRawEventLogs(eventCriteria)

  // If there are any endorsement status change events for this app during the round, it changed
  return logs.length > 0
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
    votingContract.getFunction("roundStart"),
    [roundId],
  )

  const roundEndRes = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    votingContract.getFunction("roundEnd"),
    [roundId],
  )

  if (!roundStartRes.success || !roundEndRes.success) {
    throw new Error("Failed to get round start/end blocks")
  }

  const roundStartBlock = Number(roundStartRes.result?.array?.[0] ?? 0)
  const roundEndBlock = Number(roundEndRes.result?.array?.[0] ?? 0)

  // Event signature: RewardDistributed(uint256 amount, bytes32 indexed appId, address indexed receiver, string proof, address indexed distributor)
  const eventAbi = [
    {
      anonymous: false,
      inputs: [
        { indexed: false, name: "amount", type: "uint256" },
        { indexed: true, name: "appId", type: "bytes32" },
        { indexed: true, name: "receiver", type: "address" },
        { indexed: false, name: "proof", type: "string" },
        { indexed: true, name: "distributor", type: "address" },
      ],
      name: "RewardDistributed",
      type: "event" as const,
    },
  ]

  const eventCriteria = {
    address: config.x2EarnRewardsPoolContractAddress,
    topic0: ABIContract.ofAbi(eventAbi).getEvent("RewardDistributed").signature,
    topic1: appId, // Filter by appId (indexed parameter)
    range: {
      unit: "block" as const,
      from: roundStartBlock,
      to: roundEndBlock,
    },
  }

  const logs = await thor.logs.filterRawEventLogs(eventCriteria)

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

    // Check current endorsement status
    const isEndorsedRes = await thor.contracts.executeCall(
      config.x2EarnAppsContractAddress,
      ABIContract.ofAbi(X2EarnApps.abi as any).getFunction("isAppEndorsed"),
      [appId],
    )

    const currentlyEndorsed = Boolean(isEndorsedRes.result?.array?.[0] ?? false)

    // Check if endorsement changed during the round
    const hadEndorsementChanges = await hadEndorsementChangesDuringRound(thor, config, roundId, appId)

    // Exclude apps that remained in grace period for the entire round
    // Accept apps that:
    // - Are currently endorsed (either started endorsed or became endorsed during round)
    // - Had endorsement changes during the round (went from endorsed to unendorsed or vice versa)
    // Reject apps that:
    // - Are currently unendorsed AND had no endorsement changes (remained in grace period entire round)
    if (!currentlyEndorsed && !hadEndorsementChanges) {
      console.log(`  - App ${appId} remained in grace period entire round, skipping`)
      continue
    }

    console.log(`  - App ${appId} is ELIGIBLE for DBA rewards`)
    eligibleApps.push(appId)
  }

  console.log(`Found ${eligibleApps.length} eligible apps for DBA distribution`)
  return eligibleApps
}
