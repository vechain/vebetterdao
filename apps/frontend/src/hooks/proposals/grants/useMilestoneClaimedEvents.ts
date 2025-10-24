import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { formatEther } from "ethers"
import { useMemo } from "react"

import { useEvents } from "../../useEvents"

const grantsManagerAddress = getConfig().grantsManagerContractAddress
const abi = GrantsManager__factory.abi
export type MilestoneClaimedEvent = {
  proposalId: string
  milestoneIndex: number
  amount: string // in ETH format
  amountRaw: string // raw wei amount
  blockTimestamp: number
  blockNumber: number
}
export const useMilestoneClaimedEvents = () => {
  const milestoneClaimedEvents = useEvents({
    contractAddress: grantsManagerAddress,
    eventName: "MilestoneClaimed",
    abi,
    mapResponse: response => ({
      proposalId: response.decodedData.args.proposalId.toString(),
      milestoneIndex: Number(response.decodedData.args.milestoneIndex),
      amount: formatEther(response.decodedData.args.amount.toString()),
      amountRaw: response.decodedData.args.amount.toString(),
      blockTimestamp: response.meta.blockTimestamp,
      blockNumber: response.meta.blockNumber,
    }),
  })
  // Group claimed events by proposal ID for easy lookup
  const claimedAmountsByProposal = useMemo(() => {
    const grouped: Record<string, { totalClaimed: string; events: MilestoneClaimedEvent[] }> = {}
    if (!milestoneClaimedEvents.data) {
      return grouped
    }
    milestoneClaimedEvents.data.forEach(event => {
      if (!grouped[event.proposalId]) {
        grouped[event.proposalId] = {
          totalClaimed: "0",
          events: [],
        }
      }
      const proposalGroup = grouped[event.proposalId]
      if (proposalGroup) {
        proposalGroup.events.push(event)

        // Calculate total claimed for this proposal
        const totalClaimed = proposalGroup.events.reduce((sum, evt) => sum + parseFloat(evt.amount), 0)
        proposalGroup.totalClaimed = totalClaimed.toString()
      }
    })

    return grouped
  }, [milestoneClaimedEvents.data])

  return {
    data: milestoneClaimedEvents.data,
    claimedAmountsByProposal,
    isLoading: milestoneClaimedEvents.isLoading,
    error: milestoneClaimedEvents.error,
  }
}
