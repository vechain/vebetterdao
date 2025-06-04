import { useQuery } from "@tanstack/react-query"
import { getAllEventLogs, ThorClient, useThor } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"

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
 * @param {EnvConfig} env - The environment config
 * @returns {Promise<{ claimedRewards: AllocationRewardsClaimed[] }>}
 */
export const getAllocationPoolEvents = async (thor: ThorClient, env: EnvConfig) => {
  const xAllocationPoolContractAddress = getConfig(env).xAllocationPoolContractAddress

  const eventAbi = thor.contracts
    .load(xAllocationPoolContractAddress, XAllocationPool__factory.abi)
    .getEventAbi("AllocationRewardsClaimed")

  const topics = eventAbi.encodeFilterTopicsNoNull({})

  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: xAllocationPoolContractAddress,
        topic0: topics[0] ?? undefined,
      },
      eventAbi,
    },
  ]

  const events = await getAllEventLogs({
    nodeUrl: thor.httpClient.baseURL,
    thor,
    from: 0,
    to: undefined,
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
    ] = event.decodedData as [bigint, bigint, bigint, string, string, bigint, bigint, bigint]

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

export const getAllocationPoolEventsQueryKey = (env: EnvConfig) => ["useAllocationPoolEvents", env]

/**
 * Fetches all allocation pool events
 * @param {EnvConfig} env - The environment config
 * @returns {QueryObserverResult<{ claimedRewards: AllocationRewardsClaimed[] }>}
 */
export const useAllocationPoolEvents = (env: EnvConfig) => {
  const thor = useThor()

  return useQuery({
    queryKey: getAllocationPoolEventsQueryKey(env),
    enabled: !!thor,
    queryFn: async () => {
      if (!thor) throw new Error("Thor client not available")
      return getAllocationPoolEvents(thor, env)
    },
  })
}
