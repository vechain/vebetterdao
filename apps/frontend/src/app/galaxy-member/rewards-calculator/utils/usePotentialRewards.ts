import { useAllocationAmount, useGetVoteRegisteredEvent } from "@/api"
import { useCycleToTotal } from "@/api"
import { getCallKey } from "@/hooks"
import { useMemo } from "react"

/**
 * Returns the query key for fetching the getPotentialRewards
 * * @param {string} roundId - The roundId
 * * @param {string} voter - The voter  address
 * * @param {any} GMLevel - The GMLevel selected

 * @returns The query key for fetching the potentialRewardsQueryKey
 */
export const potentialRewardsQueryKey = (roundId?: string, voter?: string, GMlevel?: any) => {
  return getCallKey({ method: "getPotentialRewards", keyArgs: [roundId, voter, GMlevel] })
}

export const usePotentialRewards = (roundId?: string, voter?: string, GMlevel?: number) => {
  const cycle = Number(roundId)
  const { data: result, isLoading: isLoadingVote } = useGetVoteRegisteredEvent({ cycle, voter })

  let error: Error | null = null
  if (result?.length === 0 || !result) {
    error = new Error(`No votes found for the round ${cycle}`)
  }

  const { data: cycleToTotal, isLoading: isLoadingCycle } = useCycleToTotal(roundId)
  const { data: allocationAmount, isLoading: isLoadingAllocation } = useAllocationAmount(roundId)

  const isLoading = isLoadingVote || isLoadingCycle || isLoadingAllocation

  const potentialRewards = useMemo(() => {
    if (!result || !cycleToTotal || !allocationAmount || GMlevel === undefined) {
      return 0
    }

    const cycleToVoterToTotal = result.reduce((sum, event) => sum + event.votes, 0)

    const increase = cycleToVoterToTotal * (GMlevel / 100)
    const cycleToVoterToTotalEnhanced = cycleToVoterToTotal + increase
    const cycleToTotalEnhanced = cycleToTotal + increase

    const rewardsEnhanced =
      (cycleToVoterToTotalEnhanced / cycleToTotalEnhanced) * Number(allocationAmount.voteXAllocations)

    return rewardsEnhanced
  }, [result, cycleToTotal, allocationAmount, GMlevel, isLoading])

  return { potentialRewards, isLoading, error }
}
