import {
  useAllocationAmount,
  useCurrentAllocationsRoundId,
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

export const usePotentialRewards = (voter?: string, GMlevel?: any, inputVOT3?: number) => {
  const [isLoading, setIsLoading] = useState(true)

  // TODO 1 : try with the currentRoundId
  // but i need to get one round at least where the user have voted to get the useCycleToTotal

  // OK, but is it only the last round that will calculate the rewards ?
  // const [roundId, setVotedRoundId] = useState<string | undefined>(undefined)
  // const hasVoted = useHasVotedInRound(roundId, voter ?? undefined)
  // if (hasVoted) {
  //   setVotedRoundId(currentRoundId)
  // } else {
  //   setVotedRoundId(String(Number(currentRoundId) - 1))
  //

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const roundId = currentRoundId
  const v = inputVOT3

  const { data: cycleToVoterToTotalEvents } = useVoteRegisteredEvents({ cycle: Number(roundId), voter: voter })
  const cycleToVoterToTotal = cycleToVoterToTotalEvents?.reduce(
    (acc, event) => acc + Number(event.rewardWeightedVote),
    0,
  )
  console.log("cycleToVoterToTotal", cycleToVoterToTotal)

  const { data: cycleToTotal } = useCycleToTotal(roundId)
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
  if (!v) return null

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
    rewards: reward_enhanced,
    isLoading: isLoading,
  }
}
