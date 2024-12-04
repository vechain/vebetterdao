import {
  useAllocationAmount,
  useCurrentAllocationsRoundId,
  useGetRewardsEventsOrFunction,
  // useHasVotedInRound,
} from "@/api"
import { gmNfts } from "@/constants/gmNfts"
import { useCycleToTotal } from "@/api"
import { useVoteRegisteredEvents } from "@/api"
import { useState } from "react"

/**
 * Hook to calculate the potential rewards based on the GM level and the n-1 round rewards
 * This calculator uses the VOT3 tokens delegated to the user.
 *
 * Note: This calculator is based on rounds that have already been voted.
 * Limitation: The formula will not count the rewards of the current or upcoming rounds.
 *
 */

export const usePotentialRewards = (voter?: string, GMlevel?: any) => {
  const [isLoading, setIsLoading] = useState(true)

  // TODO : v1 taking the current round, but for other version, need to take the last round where the user have voted
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const roundId = currentRoundId

  const { data: cycleToVoterToTotalEvents } = useVoteRegisteredEvents({ cycle: Number(roundId), voter: voter })
  const cycleToVoterToTotal = cycleToVoterToTotalEvents?.reduce(
    (acc, event) => acc + Number(event.rewardWeightedVote),
    0,
  )
  console.log("cycleToVoterToTotal", cycleToVoterToTotal)
  const actualRewards = useGetRewardsEventsOrFunction(roundId, voter)

  const cycleToTotal = useCycleToTotal(roundId)
  const { data: emissionAmount } = useAllocationAmount(roundId)

  const emissionAmount_voterRewards = emissionAmount?.voteX2Earn
  // const emissionAmount_voterRewards = useMemo(() => {
  //   if (!emissionAmount) return 0
  //   return Object.values(emissionAmount).reduce((acc, amount) => acc + Number(amount), 0)
  // }, [emissionAmount])

  // Get the GMMultiplier by mapping the GMlevel to the GMNFT
  if (!GMlevel) return null
  const gm = gmNfts.find((nft: { level: any }) => nft.level === GMlevel)
  const GMMultiplier = gm?.multiplier

  if (GMMultiplier === undefined) return null
  if (cycleToTotal === undefined) return null
  if (cycleToVoterToTotal === undefined) return null
  if (emissionAmount_voterRewards === undefined) return null

  const increase = cycleToVoterToTotal * (GMMultiplier / 100)
  const cycleToVoterToTotal_enhanced = cycleToVoterToTotal + increase
  const cycleToTotal_enhanced = cycleToTotal + increase
  console.log("increase", increase)
  console.log("cycleToVoterToTotal_enhanced", cycleToVoterToTotal_enhanced)
  console.log("cycleToTotal_enhanced", cycleToTotal_enhanced)

  const reward_enhanced = (cycleToVoterToTotal_enhanced / cycleToTotal_enhanced) * Number(emissionAmount_voterRewards)
  console.log("reward_enhanced", reward_enhanced)
  setIsLoading(false)
  // get the original reward to plot the difference and make an animation on another card
  // const originalReward = ${rewardClaimed event}

  return {
    actualRewards: actualRewards,
    potentialRewards: reward_enhanced,
    isLoading: isLoading,
  }
}
