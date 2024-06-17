import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import { XAllocationPoolJson } from "@repo/contracts"

const XALLOCATION_POLL_CONTRACT = getConfig().xAllocationPoolContractAddress

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
 * @param {Connex.Thor} thor
 * @returns {Promise<{ claimedRewards: AllocationRewardsClaimed[] >}
 */

export const getAllocationPoolEvents = async (thor: Connex.Thor) => {
  const allocationRewardsClaimedAbi = XAllocationPoolJson.abi.find(abi => abi.name === "AllocationRewardsClaimed")
  if (!allocationRewardsClaimedAbi) throw new Error("AllocationRewardsClaimed event not found")
  const allocationRewardsClaimedEvent = new abi.Event(allocationRewardsClaimedAbi as abi.Event.Definition)

  const filterCriteria = [
    {
      address: XALLOCATION_POLL_CONTRACT,
      topic0: allocationRewardsClaimedEvent.signature,
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  const decodedAllocationRewardsClaimedEvents: AllocationRewardsClaimed[] = []

  events.forEach(event => {
    switch (event.topics[0]) {
      case allocationRewardsClaimedEvent.signature: {
        const decoded = allocationRewardsClaimedEvent.decode(event.data, event.topics)
        decodedAllocationRewardsClaimedEvents.push({
          appId: decoded[0],
          roundId: decoded[1],
          totalAmount: decoded[2],
          recipient: decoded[3],
          caller: decoded[4],
          unallocatedAmount: decoded[5],
          teamAllocationAmount: decoded[6],
          x2EarnRewardsPoolAmount: decoded[6],
        })
        break
      }

      default: {
        throw new Error("Unknown event")
      }
    }
  })

  return {
    claimedRewards: decodedAllocationRewardsClaimedEvents,
  }
}

export const getAllocationPoolEventsQueryKey = () => ["useAllocationPoolEvents"]

/**
 * Fetches all allocation pool events
 * @returns {QueryObserverResult<{ claimedRewards: AllocationRewardsClaimed[] >}
 */
export const useAllocationPoolEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationPoolEventsQueryKey(),
    queryFn: async () => await getAllocationPoolEvents(thor),
    enabled: !!thor && !!thor.status.head.number,
  })
}
