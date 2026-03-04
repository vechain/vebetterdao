import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { ABIContract, Revision } from "@vechain/sdk-core"
import {
  DBAPool__factory,
  X2EarnApps__factory,
  X2EarnRewardsPool__factory,
  XAllocationPool__factory,
  XAllocationVoting__factory,
} from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const xAllocationPoolAddress = getConfig().xAllocationPoolContractAddress as `0x${string}`
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`
const x2EarnAppsAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`
const x2EarnRewardsPoolAddress = getConfig().x2EarnRewardsPoolContractAddress as `0x${string}`
const dbaPoolAddress = getConfig().dbaPoolContractAddress as `0x${string}`

/**
 * Hook to estimate DBA rewards for apps in an active round using merit-capped flat distribution.
 *
 * Mirrors the contract logic (DBAPool V3):
 * 1. flatShare = totalUnallocated / eligibleAppsCount
 * 2. meritCap = meritCapMultiplier * (totalEarnings - baseAllocation)
 * 3. appReward = min(flatShare, meritCap)
 * 4. Overflow from merit cap + integer remainder → treasury
 *
 * Returns per-app estimated amounts in `appEstimates` map.
 */
export const useEstimateDBAForActiveRound = (roundId: string | number, isEligible: boolean) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["estimateDBAActiveRound", roundId, isEligible],
    queryFn: async () => {
      const emptyResult = {
        appEstimates: {} as Record<string, string>,
        isSimulation: true,
        totalAppsCount: 0,
        eligibleAppsCount: 0,
        totalUnallocated: "0",
        treasuryOverflow: "0",
        eligibleAppIds: [] as string[],
      }

      if (!isEligible || !thor) return emptyResult

      try {
        const appsRes = await thor.contracts.executeCall(
          xAllocationVotingAddress,
          ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("getAppIdsOfRound"),
          [BigInt(roundId)],
        )

        if (!appsRes.success) throw new Error("Failed to get apps for round")

        const appsInRound = (appsRes.result?.array?.[0] as string[]) || []
        if (appsInRound.length === 0) return emptyResult

        // Fetch round snapshot, base allocation, and merit cap multiplier in parallel
        const [roundSnapshotRes, baseAllocationRes, meritCapRes] = await Promise.all([
          thor.contracts.executeCall(
            xAllocationVotingAddress,
            ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("roundSnapshot"),
            [BigInt(roundId)],
          ),
          thor.contracts.executeCall(
            xAllocationPoolAddress,
            ABIContract.ofAbi(XAllocationPool__factory.abi).getFunction("baseAllocationAmount"),
            [BigInt(roundId)],
          ),
          thor.contracts.executeCall(
            dbaPoolAddress,
            ABIContract.ofAbi(DBAPool__factory.abi).getFunction("meritCapMultiplier"),
            [],
          ),
        ])

        if (!roundSnapshotRes.success) throw new Error("Failed to get round snapshot")

        const roundStartBlock = Number(roundSnapshotRes.result?.array?.[0] ?? 0)
        const roundStartBlockStr = String(roundStartBlock)
        const baseAllocation = (baseAllocationRes.result?.array?.[0] as bigint) ?? 0n
        const meritCapMultiplier = (meritCapRes.result?.array?.[0] as bigint) ?? 2n

        const appsData = await Promise.all(
          appsInRound.map(async appId => {
            // Get earnings (includes totalEarnings and unallocatedAmount)
            const earningsRes = await thor.contracts.executeCall(
              xAllocationPoolAddress,
              ABIContract.ofAbi(XAllocationPool__factory.abi).getFunction("roundEarnings"),
              [BigInt(roundId), appId],
            )

            // Get app shares to check vote participation
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
              options: { offset: 0, limit: 1 }, // We only need to know if at least 1 exists
              order: "desc",
            })

            const totalEarnings = (earningsRes.result?.array?.[0] as bigint) ?? 0n
            const unallocatedAmount = (earningsRes.result?.array?.[1] as bigint) ?? 0n
            const appShare = Number(sharesRes.result?.array?.[0] ?? 0)
            const wasUnendorsedAtStart = (unendorsedAtStartRes.result?.array?.[0] as boolean) ?? false
            const isCurrentlyUnendorsed = (unendorsedCurrentlyRes.result?.array?.[0] as boolean) ?? false
            const hasRewardedActions = rewardEvents.length > 0

            // App should NOT get DBA only if it started the round unendorsed AND is currently still unendorsed
            const shouldExcludeFromDBA = wasUnendorsedAtStart && isCurrentlyUnendorsed

            const isEligible = appShare > 0 && !shouldExcludeFromDBA && hasRewardedActions

            return {
              appId,
              totalEarnings,
              unallocatedAmount,
              appShare,
              isEligible,
            }
          }),
        )

        const totalUnallocated = appsData.reduce((sum: bigint, app) => sum + app.unallocatedAmount, 0n)
        const eligibleApps = appsData.filter(app => app.isEligible)
        const eligibleAppsCount = eligibleApps.length

        // Merit-capped flat distribution (mirrors DBAPool.distributeDBARewards)
        const appEstimates: Record<string, string> = {}
        let overflow = 0n

        if (eligibleAppsCount > 0 && totalUnallocated > 0n) {
          const flatSharePerApp = totalUnallocated / BigInt(eligibleAppsCount)
          overflow = totalUnallocated % BigInt(eligibleAppsCount)

          for (const app of eligibleApps) {
            const voteEarnings = app.totalEarnings > baseAllocation ? app.totalEarnings - baseAllocation : 0n
            const meritCap = meritCapMultiplier * voteEarnings
            const appReward = flatSharePerApp < meritCap ? flatSharePerApp : meritCap
            overflow += flatSharePerApp - appReward
            appEstimates[app.appId] = formatEther(appReward)
          }
        }

        return {
          appEstimates,
          isSimulation: true,
          totalAppsCount: appsInRound.length,
          eligibleAppsCount,
          totalUnallocated: formatEther(totalUnallocated),
          treasuryOverflow: formatEther(overflow),
          eligibleAppIds: eligibleApps.map(app => app.appId),
        }
      } catch (error) {
        console.error("Error estimating DBA for active round:", error)
        return {
          appEstimates: {} as Record<string, string>,
          isSimulation: true,
          totalAppsCount: 0,
          eligibleAppsCount: 0,
          totalUnallocated: "0",
          treasuryOverflow: "0",
          eligibleAppIds: [],
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
    enabled: !!roundId && isEligible && !!thor,
  })
}
