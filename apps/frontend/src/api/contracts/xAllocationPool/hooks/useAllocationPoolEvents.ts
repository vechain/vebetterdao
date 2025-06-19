import { useQuery } from "@tanstack/react-query"
import { getAllEventLogs, ThorClient, useThor } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts/typechain-types"
import { ExtractEventParams } from "../../governance"

const abi = XAllocationPool__factory.abi

export type AllocationRewardsClaimed = {
  appId: string
  roundId: string
  totalAmount: string
  recipient: string
  caller: string
  unallocatedAmount: string
  teamAllocationAmount: string
  x2EarnRewardsPoolAmount: string
}

/**
 * Fetches all allocation pool events
 * @param {ThorClient} thor - The thor client
 * @returns {Promise<{ claimedRewards: AllocationRewardsClaimed[] }>}
 */
export const getAllocationPoolEvents = async (thor: ThorClient) => {
  const xAllocationPoolContractAddress = getConfig().xAllocationPoolContractAddress

  const eventAbi = thor.contracts
    .load(xAllocationPoolContractAddress, XAllocationPool__factory.abi)
    .getEventAbi("AllocationRewardsClaimed")

  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: xAllocationPoolContractAddress,
        topic0: eventAbi.signatureHash,
      },
      eventAbi,
    },
  ]

  const events = await getAllEventLogs({
    nodeUrl: getConfig().nodeUrl,
    thor,
    filterCriteria,
  })

  const decodedAllocationRewardsClaimedEvents: AllocationRewardsClaimed[] = []

  events.forEach(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

    const [
      appId,
      roundId,
      totalAmount,
      recipient,
      caller,
      unallocatedAmount,
      teamAllocationAmount,
      x2EarnRewardsPoolAmount,
    ] = event.decodedData as unknown as ExtractEventParams<typeof abi, "AllocationRewardsClaimed">

    decodedAllocationRewardsClaimedEvents.push({
      appId: appId.toString(),
      roundId: roundId.toString(),
      totalAmount: totalAmount.toString(),
      recipient,
      caller,
      unallocatedAmount: unallocatedAmount.toString(),
      teamAllocationAmount: teamAllocationAmount.toString(),
      x2EarnRewardsPoolAmount: x2EarnRewardsPoolAmount.toString(),
    })
  })

  return {
    claimedRewards: decodedAllocationRewardsClaimedEvents,
  }
}

export const getAllocationPoolEventsQueryKey = () => ["useAllocationPoolEvents"]

/**
 * Fetches all allocation pool events
 * @returns {QueryObserverResult<{ claimedRewards: AllocationRewardsClaimed[] }>}
 */
export const useAllocationPoolEvents = () => {
  const thor = useThor()

  return useQuery({
    queryKey: getAllocationPoolEventsQueryKey(),
    enabled: !!thor,
    queryFn: async () => {
      return getAllocationPoolEvents(thor)
    },
  })
}
