import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { FilterCriteria } from "@vechain/sdk-network"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { getAllEventLogs, ThorClient, useThor } from "@vechain/vechain-kit"

import { decodeEventLog } from "@/api/contracts/governance/getEvents"

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
  const events = (
    await getAllEventLogs({
      nodeUrl: getConfig().nodeUrl,
      thor,
      filterCriteria,
    })
  ).map(event => decodeEventLog(event, abi))

  const decodedAllocationRewardsClaimedEvents: AllocationRewardsClaimed[] = []

  events.forEach(({ decodedData }) => {
    if (decodedData.eventName !== "AllocationRewardsClaimed") throw new Error(`Unknown event: ${decodedData.eventName}`)

    const {
      appId,
      roundId,
      totalAmount,
      recipient,
      caller,
      unallocatedAmount,
      teamAllocationAmount,
      rewardsAllocationAmount: x2EarnRewardsPoolAmount,
    } = decodedData.args

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
