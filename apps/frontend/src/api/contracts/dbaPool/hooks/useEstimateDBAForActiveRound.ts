import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { ABIContract, Revision } from "@vechain/sdk-core"
import {
  X2EarnApps__factory,
  X2EarnRewardsPool__factory,
  XAllocationPool__factory,
  XAllocationVoting__factory,
} from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"
import { formatEther } from "viem"

import { DBA_ELIGIBILITY_THRESHOLD_SCALED } from "../constants"

const xAllocationPoolAddress = getConfig().xAllocationPoolContractAddress as `0x${string}`
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`
const x2EarnAppsAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`
const x2EarnRewardsPoolAddress = getConfig().x2EarnRewardsPoolContractAddress as `0x${string}`

/**
 * Hook to estimate DBA rewards for an app in an active round
 *
 * Calculation method:
 * 1. Get all apps in the round
 * 2. For each app, call roundEarnings() to get unallocatedAmount
 * 3. Sum all unallocatedAmount values = total DBA pool for the round
 * 4. Count eligible apps based on ALL criteria:
 *    - App has < 7.5% votes (< 750 in scaled format)
 *    - App has rewarded at least 1 action in the round (RewardDistributed event)
 *    - App should NOT get DBA only if it started the round unendorsed AND is currently still unendorsed
 * 5. DBA per eligible app = total DBA pool / eligible apps count
 *
 * @param roundId The round ID
 * @param isEligible Whether the app is potentially eligible for DBA (pre-filtered by vote %)
 * @returns Estimated DBA rewards amount
 */
export const useEstimateDBAForActiveRound = (roundId: string | number, isEligible: boolean) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["estimateDBAActiveRound", roundId, isEligible],
    queryFn: async () => {
      if (!isEligible || !thor) {
        return {
          estimatedAmount: "0",
          isSimulation: true,
          totalAppsCount: 0,
          eligibleAppsCount: 0,
          totalUnallocated: "0",
          eligibleAppIds: [],
        }
      }

      try {
        // 1. Get all apps in the round
        const appsRes = await thor.contracts.executeCall(
          xAllocationVotingAddress,
          ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("getAppIdsOfRound"),
          [BigInt(roundId)],
        )

        if (!appsRes.success) {
          throw new Error("Failed to get apps for round")
        }

        const appsInRound = (appsRes.result?.array?.[0] as string[]) || []

        if (appsInRound.length === 0) {
          return {
            estimatedAmount: "0",
            isSimulation: true,
            totalAppsCount: 0,
            eligibleAppsCount: 0,
            totalUnallocated: "0",
            eligibleAppIds: [],
          }
        }

        // Get round start block (snapshot) to check historical endorsement status
        const roundSnapshotRes = await thor.contracts.executeCall(
          xAllocationVotingAddress,
          ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("roundSnapshot"),
          [BigInt(roundId)],
        )

        if (!roundSnapshotRes.success) {
          throw new Error("Failed to get round snapshot")
        }

        const roundStartBlock = Number(roundSnapshotRes.result?.array?.[0] ?? 0)
        const roundStartBlockStr = String(roundStartBlock)

        // 2. For each app, check full eligibility criteria
        const appsData = await Promise.all(
          appsInRound.map(async appId => {
            // Get earnings (includes unallocatedAmount)
            const earningsRes = await thor.contracts.executeCall(
              xAllocationPoolAddress,
              ABIContract.ofAbi(XAllocationPool__factory.abi).getFunction("roundEarnings"),
              [BigInt(roundId), appId],
            )

            // Get app shares to check vote percentage
            const sharesRes = await thor.contracts.executeCall(
              xAllocationPoolAddress,
              ABIContract.ofAbi(XAllocationPool__factory.abi).getFunction("getAppShares"),
              [BigInt(roundId), appId],
            )

            // Check if app was unendorsed at round start
            const unendorsedAtStartRes = await thor.contracts.executeCall(
              x2EarnAppsAddress,
              ABIContract.ofAbi(X2EarnApps__factory.abi).getFunction("isAppUnendorsed"),
              [appId],
              { revision: Revision.of(roundStartBlockStr) as any },
            )

            // Check if app is currently unendorsed
            const unendorsedCurrentlyRes = await thor.contracts.executeCall(
              x2EarnAppsAddress,
              ABIContract.ofAbi(X2EarnApps__factory.abi).getFunction("isAppUnendorsed"),
              [appId],
            )

            // Check if app has rewarded actions in this round (RewardDistributed event)
            const rewardEventAbi = thor.contracts
              .load(x2EarnRewardsPoolAddress, X2EarnRewardsPool__factory.abi)
              .getEventAbi("RewardDistributed")
            const topics = rewardEventAbi.encodeFilterTopicsNoNull({ appId })

            const rewardEvents = await thor.logs.filterEventLogs({
              criteriaSet: [
                {
                  criteria: {
                    address: x2EarnRewardsPoolAddress,
                    topic0: topics[0] ?? undefined,
                    topic1: topics[1] ?? undefined,
                  },
                  eventAbi: rewardEventAbi,
                },
              ],
              options: {
                offset: 0,
                limit: 1, // We only need to know if at least 1 exists
              },
              order: "desc",
            })

            const unallocatedAmount = (earningsRes.result?.array?.[1] as bigint) ?? 0n
            const appShare = Number(sharesRes.result?.array?.[0] ?? 0)
            const wasUnendorsedAtStart = (unendorsedAtStartRes.result?.array?.[0] as boolean) ?? false
            const isCurrentlyUnendorsed = (unendorsedCurrentlyRes.result?.array?.[0] as boolean) ?? false
            const hasRewardedActions = rewardEvents.length > 0

            // App should NOT get DBA only if it started the round unendorsed AND is currently still unendorsed
            const shouldExcludeFromDBA = wasUnendorsedAtStart && isCurrentlyUnendorsed

            // Full eligibility check
            const isEligible =
              appShare < DBA_ELIGIBILITY_THRESHOLD_SCALED && // < 7.5% votes (750 in scaled format)
              appShare > 0 && // Participated in voting
              !shouldExcludeFromDBA && // Not excluded due to endorsement status
              hasRewardedActions // Has rewarded at least 1 action

            return {
              appId,
              unallocatedAmount,
              appShare,
              wasUnendorsedAtStart,
              isCurrentlyUnendorsed,
              hasRewardedActions,
              isEligible,
            }
          }),
        )

        // 3. Sum all unallocated amounts
        const totalUnallocated = appsData.reduce((sum: bigint, app) => sum + app.unallocatedAmount, 0n)

        // 4. Count eligible apps (all criteria met)
        const eligibleAppsCount = appsData.filter(app => app.isEligible).length

        // 5. Calculate DBA per eligible app
        let dbaPerEligibleApp = 0n
        if (eligibleAppsCount > 0 && totalUnallocated > 0n) {
          dbaPerEligibleApp = totalUnallocated / BigInt(eligibleAppsCount)
        }

        return {
          estimatedAmount: formatEther(dbaPerEligibleApp),
          isSimulation: true,
          totalAppsCount: appsInRound.length,
          eligibleAppsCount: eligibleAppsCount,
          totalUnallocated: formatEther(totalUnallocated),
          appsWithUnallocated: appsData.filter(app => app.unallocatedAmount > 0n).length,
          eligibleAppIds: appsData.filter(app => app.isEligible).map(app => app.appId), // List of eligible app IDs
        }
      } catch (error) {
        console.error("Error estimating DBA for active round:", error)
        return {
          estimatedAmount: "0",
          isSimulation: true,
          totalAppsCount: 0,
          eligibleAppsCount: 0,
          totalUnallocated: "0",
          eligibleAppIds: [],
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
    enabled: !!roundId && isEligible && !!thor,
  })
}
