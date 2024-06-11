import { compareAddresses } from "@repo/utils/AddressUtils"
import { useAllocationPoolEvents } from "../../xAllocationPool"
import { ethers } from "ethers"

export const useAppAllocations = (appId: string) => {
  const { data, error, isLoading } = useAllocationPoolEvents()
  const appAllocations =
    data?.claimedRewards
      ?.filter(allocation => compareAddresses(allocation.appId, appId))
      .sort((a, b) => Number(a.roundId) - Number(b.roundId))
      .map(allocation => {
        return {
          ...allocation,
          scaledAmount: ethers.formatEther(allocation.amount),
        }
      }) || []
  const totalAllocationReceived = appAllocations.reduce((acc, curr) => acc + Number(curr.scaledAmount), 0)
  const lastRoundAllocationReceived = Number(appAllocations[appAllocations.length - 1]?.scaledAmount) || 0
  const averageAllocationReceived = totalAllocationReceived / appAllocations.length

  return {
    data,
    error,
    isLoading,
    appAllocations,
    totalAllocationReceived,
    lastRoundAllocationReceived,
    averageAllocationReceived,
  }
}
