import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useQuery } from "@tanstack/react-query"
import { ABIContract } from "@vechain/sdk-core"
import { DBAPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { useAllocationPoolEvents } from "@/api/contracts/xAllocationPool/hooks/useAllocationPoolEvents"

import { useDBADistributionStartRound } from "../../dbaPool/hooks/useDBADistributionStartRound"

const dbaPoolAddress = getConfig().dbaPoolContractAddress as `0x${string}`
const dbaPoolAbi = DBAPool__factory.abi

/**
 * Fetches all DBA rewards for a specific app across all rounds
 * Uses dbaRoundRewardsForApp(roundId, appId) contract function
 * @param appId The app ID
 * @param roundIds Array of round IDs to check
 * @returns Total DBA and DBA by round
 */
const useAppDBARewards = (appId: string, roundIds: number[]) => {
  const thor = useThor()
  const { data: dbaStartRound } = useDBADistributionStartRound()

  return useQuery({
    queryKey: ["appDBARewards", appId, roundIds, dbaPoolAddress],
    queryFn: async () => {
      // Only check rounds >= dbaStartRound
      const eligibleRounds = dbaStartRound !== undefined ? roundIds.filter(r => r >= dbaStartRound) : []

      if (eligibleRounds.length === 0) {
        return { totalDBA: 0, dbaByRound: {} }
      }

      try {
        let totalDBA = 0
        const dbaByRound: Record<number, number> = {}

        // Query DBA rewards for each eligible round
        for (const roundId of eligibleRounds) {
          const result = await thor.contracts.executeCall(
            dbaPoolAddress,
            ABIContract.ofAbi(dbaPoolAbi).getFunction("dbaRoundRewardsForApp"),
            [BigInt(roundId), appId],
          )

          const amount = (result.result?.array?.[0] as bigint) ?? 0n
          const dbaAmount = Number(ethers.formatEther(amount))

          if (dbaAmount > 0) {
            totalDBA += dbaAmount
            dbaByRound[roundId] = dbaAmount
          }
        }

        return { totalDBA, dbaByRound }
      } catch (error) {
        console.error("Error fetching DBA rewards:", error)
        return { totalDBA: 0, dbaByRound: {} }
      }
    },
    enabled: !!appId && !!thor && dbaStartRound !== undefined && roundIds.length > 0,
  })
}

/**
 * Fetches all allocation pool events and DBA rewards for an app
 * @param appId The app ID
 * @returns Total allocations including DBA rewards
 */
export const useAppAllocations = (appId: string) => {
  const { data, error, isLoading } = useAllocationPoolEvents()

  // Extract round IDs from claimed rewards
  const roundIds =
    data?.claimedRewards
      ?.filter(allocation => compareAddresses(allocation.appId, appId))
      .map(allocation => Number(allocation.roundId)) || []

  const { data: dbaData, isLoading: isDBALoading } = useAppDBARewards(appId, roundIds)

  const appAllocations =
    data?.claimedRewards
      ?.filter(allocation => compareAddresses(allocation.appId, appId))
      .sort((a, b) => Number(a.roundId) - Number(b.roundId))
      .map(allocation => {
        const roundId = Number(allocation.roundId)
        const baseAmount = ethers.formatEther(allocation.totalAmount)
        const dbaAmount = dbaData?.dbaByRound[roundId] ?? 0
        const totalAmount = Number(baseAmount) + dbaAmount

        return {
          ...allocation,
          scaledAmount: baseAmount,
          dbaAmount: dbaAmount.toString(),
          totalWithDBA: totalAmount.toString(),
        }
      }) || []

  const totalAllocationReceived = appAllocations.reduce((acc, curr) => acc + Number(curr.totalWithDBA), 0)
  const lastRoundAllocationReceived = Number(appAllocations[appAllocations.length - 1]?.totalWithDBA) || 0
  const averageAllocationReceived = appAllocations.length ? totalAllocationReceived / appAllocations.length : 0

  return {
    data,
    error,
    isLoading: isLoading || isDBALoading,
    appAllocations,
    totalAllocationReceived,
    lastRoundAllocationReceived,
    averageAllocationReceived,
  }
}
