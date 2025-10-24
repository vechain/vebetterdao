import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { ABIContract } from "@vechain/sdk-core"
import { XAllocationPool__factory, XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const xAllocationPoolAddress = getConfig().xAllocationPoolContractAddress as `0x${string}`
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

// DBA eligibility threshold: apps with < 7.5% votes (750 in scaled format where 100 = 1%)
const DBA_ELIGIBILITY_THRESHOLD = 750

/**
 * Hook to estimate DBA rewards for an app in an active round
 *
 * Calculation method:
 * 1. Get all apps in the round
 * 2. For each app, call roundEarnings() to get unallocatedAmount
 * 3. Sum all unallocatedAmount values = total DBA pool for the round
 * 4. Count eligible apps based on:
 *    - App has < 7.5% votes (< 750 in scaled format)
 * 5. DBA per eligible app = total DBA pool / eligible apps count
 *
 * Note: This is a simplified frontend calculation. The actual lambda also checks:
 * - App rewarded at least 1 action with proofs
 * - App was endorsed at round start and during the round
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
          }
        }

        // 2. For each app, get roundEarnings to extract unallocatedAmount
        // Also get app shares to check vote percentage for eligibility
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

            const unallocatedAmount = (earningsRes.result?.array?.[1] as bigint) ?? 0n // Index 1 is unallocatedAmount
            const appShare = Number(sharesRes.result?.array?.[0] ?? 0) // App's vote share (scaled: 100 = 1%)

            return {
              appId,
              unallocatedAmount,
              appShare,
              isEligible: appShare < DBA_ELIGIBILITY_THRESHOLD && appShare > 0, // < 7.5% and participated
            }
          }),
        )

        // 3. Sum all unallocated amounts
        const totalUnallocated = appsData.reduce((sum: bigint, app) => sum + app.unallocatedAmount, 0n)

        // 4. Count eligible apps (< 7.5% votes)
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
        }
      } catch (error) {
        console.error("Error estimating DBA for active round:", error)
        return {
          estimatedAmount: "0",
          isSimulation: true,
          totalAppsCount: 0,
          eligibleAppsCount: 0,
          totalUnallocated: "0",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
    enabled: !!roundId && isEligible && !!thor,
  })
}
