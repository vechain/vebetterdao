import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useQuery } from "@tanstack/react-query"
import { DBAPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor, decodeEventLog } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { useAllocationPoolEvents } from "@/api/contracts/xAllocationPool/hooks/useAllocationPoolEvents"

const dbaPoolAddress = getConfig().dbaPoolContractAddress as `0x${string}`
const dbaPoolAbi = DBAPool__factory.abi

/**
 * Fetches all DBA rewards for a specific app across all rounds
 * @param appId The app ID
 * @returns Total DBA rewards received
 */
const useAppDBARewards = (appId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["appDBARewards", appId, dbaPoolAddress],
    queryFn: async () => {
      try {
        const eventAbi = thor.contracts.load(dbaPoolAddress, dbaPoolAbi).getEventAbi("FundsDistributedToApp")
        const topics = eventAbi.encodeFilterTopicsNoNull({ appId })

        const logs = await thor.logs.filterEventLogs({
          criteriaSet: [
            {
              criteria: {
                address: dbaPoolAddress,
                topic0: topics[0] ?? undefined,
                topic1: topics[1] ?? undefined,
              },
              eventAbi,
            },
          ],
          options: {
            offset: 0,
            limit: 256,
          },
          order: "asc",
        })

        let totalDBA = 0
        const dbaByRound: Record<number, number> = {}

        logs.forEach(eventLog => {
          const event = decodeEventLog(eventLog, dbaPoolAbi)
          if (event.decodedData.eventName === "FundsDistributedToApp") {
            const amount = event.decodedData.args.amount
            const roundId = Number(event.decodedData.args.roundId)
            const dbaAmount = Number(ethers.formatEther(amount))

            totalDBA += dbaAmount
            dbaByRound[roundId] = dbaAmount
          }
        })

        return { totalDBA, dbaByRound }
      } catch (error) {
        console.error("Error fetching DBA rewards:", error)
        return { totalDBA: 0, dbaByRound: {} }
      }
    },
    enabled: !!appId && !!thor,
  })
}

/**
 * Fetches all allocation pool events and DBA rewards for an app
 * @param appId The app ID
 * @returns Total allocations including DBA rewards
 */
export const useAppAllocations = (appId: string) => {
  const { data, error, isLoading } = useAllocationPoolEvents()
  const { data: dbaData, isLoading: isDBALoading } = useAppDBARewards(appId)

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
