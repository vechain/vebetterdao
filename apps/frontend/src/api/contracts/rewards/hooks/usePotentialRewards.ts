import { useAllocationAmount, getVoteRegisteredEvents } from "@/api"
import { useCycleToTotal } from "@/api"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getCallKey } from "@/hooks"

/**
 * Returns the query key for fetching the getPotentialRewards
 * * @param {string} roundId - The roundId
 * * @param {string} voter - The voter  address
 * * @param {any} GMLevel - The GMLevel selected

 * @returns The query key for fetching the getPotentialRewardsQueryKey
 */
export const getPotentialRewardsQueryKey = (roundId?: string, voter?: string, GMlevel?: any) => {
  return getCallKey({ method: "getPotentialRewards", keyArgs: [roundId, voter, GMlevel] })
}

export const usePotentialRewards = async (roundId?: string, voter?: string, GMlevel?: any) => {
  const { thor } = useConnex()

  const cycleToVoterToTotal = getVoteRegisteredEvents(thor, { cycle: Number(roundId), voter: voter }).then(events => {
    return events.reduce((acc, event) => acc + Number(event.rewardWeightedVote), 0)
  })
  console.log("check 1 of potential rewards cycleToVoterToTotal", cycleToVoterToTotal)

  const { data: cycleToTotal } = useCycleToTotal(roundId)
  console.log("check 2 of potential rewards cycleToTotal", cycleToTotal)

  const { data: allocationAmount } = useAllocationAmount(roundId)
  console.log("check 3 of potential rewards allocationAmount", allocationAmount)

  return useQuery({
    queryKey: getPotentialRewardsQueryKey(roundId, voter, GMlevel),
    queryFn: async () => {
      const increase = (await cycleToVoterToTotal) * (GMlevel / 100)
      const cycleToVoterToTotalEnhanced = (await cycleToVoterToTotal) + increase
      const cycleToTotalEnhanced = (await cycleToTotal) + increase

      const rewardsEnhanced =
        (cycleToVoterToTotalEnhanced / cycleToTotalEnhanced) * Number(allocationAmount?.voteXAllocations)

      return {
        rewards: rewardsEnhanced,
      }
    },
  })
}
