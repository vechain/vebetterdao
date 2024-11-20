import { useAllocationVoters, useVot3Balance, useAllocationAmount } from "@/api"
import { gmNfts } from "@/constants/gmNfts"
import { useCycleToTotal } from "@/api"
import { useMemo } from "react"

/**
 * Hook to calculate the potential rewards based on the GM level and the rounds
 * in which the user has participated. This calculator uses the VOT3 tokens
 * delegated to the user.
 *
 * Note: This calculator is based on rounds that have already been played.
 * Limitation: If the user has only voted once, the calculation will be based
 * on that single round for the given NFT.
 *
 * Based on the formula:
 * const XAllocationReward = (1(square(totalVOT3) * NFTMultiplier))
 * const GovernanceRewards = totalParticipantCurrentRound * (1$(square(totalVOT3) * NFTMultiplier))
 * const TotalRewards = XAllocationReward + GovernanceRewards
 *
 * const B3TRRewards = totalRewards_i / ∑(totalRewards_j) * totalAllocation
 * Where the sum is taken over all users j participating in the voting
 * totalAllocation = 50 Million lately, but fetch that data
 */

export const usePotentialRewards = (roundId?: string, voter?: string, GMlevel?: any) => {
  const { data: totalRewardsSum } = useCycleToTotal(roundId)
  // TotalVoter
  const { data: voters } = useAllocationVoters(roundId)
  const { data: v } = useVot3Balance(voter)
  const { data: roundAmount } = useAllocationAmount(roundId)
  const totalAllocation = useMemo(() => {
    if (!roundAmount) return 0
    return Object.values(roundAmount).reduce((acc, amount) => acc + Number(amount), 0)
  }, [roundAmount])

  // Get the GMMultiplier by mapping the GMlevel to the GMNFT
  if (!GMlevel) return null
  const gm = gmNfts.find((nft: { level: any }) => nft.level === GMlevel)
  const GMMultiplier = gm?.multiplier //OK

  // TODO: double check the format, and if it's fetching correctly the data

  // Need to fetch the cycleToVoterToTotal from the contract
  // ∑(totalRewards_j) maybe == cycleToTotal because it   /// @notice Get the total reward-weighted votes in a specific cycle.
  // square(cycleToVoterToTotal) = totalVOT3 for the round

  // TODO: double check how the type should be convert to
  console.log("voter", voters)
  // TODO: ask if in the formula it is well the vot3Balance : represents the VOT3 tokens delegated to a user for a given voting round

  // Fetching the total allocation
  // isLoading: roundAmountLoading, error: roundAmountError

  // Do it in another way for the check of the data from hooks
  if (GMMultiplier === undefined) return null
  if (totalRewardsSum === undefined) return null
  if (!v) return null
  const xAllocationReward = 1 * Math.pow(totalRewardsSum, 2) * GMMultiplier
  const gouvernanceRewards = Number(voters) * (1 * Math.pow(Number(v.formatted), 2) * GMMultiplier)

  const totalAllocationFormatted = Number(totalAllocation)

  const totalRewardsi = xAllocationReward + gouvernanceRewards
  const totalRewardsj = 0 // Need to fetch that data
  // How to fetch all the TotalRewards of every user j participating : costing too much time and energy
  // TODO : think about another way to fetch that data, maybe use a hook. But again, it will maybe take too much time to loop over all the users the getRewards
  // Take a look at the storage
  // Add the sum
  const B3TRRewards = (totalRewardsi / totalRewardsj) * totalAllocationFormatted
  return {
    rewards: B3TRRewards,
  }
}
