import { gmNfts } from "@/constants/gmNfts"
/**
 * Hook to calculate the potential rewards based on the GM level and the n-1 round rewards
 * This calculator uses the VOT3 tokens delegated to the user.
 *
 * Note: This calculator is based on rounds that have already been voted.
 * Limitation: The formula will not count the rewards of the current or upcoming rounds.
 *
 */

type PotentialRewards = {
  potentialRewards: number | 0
  isLoading: boolean
  error?: any
}

export const usePotentialRewards = (
  cycleToTotal: number,
  emissionAmount_voterRewards: string,
  cycleToVoterToTotal?: number,
  GMlevel?: any,
): PotentialRewards => {
  if (!cycleToTotal || !emissionAmount_voterRewards || !cycleToVoterToTotal || !GMlevel) {
    return {
      potentialRewards: 0,
      isLoading: true,
    }
  }

  try {
    const gm = gmNfts.find((nft: { level: any }) => nft.level === GMlevel)
    const GMMultiplier = gm?.multiplier

    if (
      GMMultiplier === undefined ||
      cycleToTotal === undefined ||
      cycleToVoterToTotal === undefined ||
      emissionAmount_voterRewards === undefined
    ) {
      return {
        potentialRewards: 0,
        isLoading: false,
      }
    }

    const increase = cycleToVoterToTotal * (GMMultiplier / 100)
    const cycleToVoterToTotal_enhanced = cycleToVoterToTotal + increase
    const cycleToTotal_enhanced = cycleToTotal + increase
    const reward_enhanced =
      (cycleToVoterToTotal_enhanced / Number(cycleToTotal_enhanced)) * Number(emissionAmount_voterRewards)

    return {
      potentialRewards: reward_enhanced,
      isLoading: false,
    }
  } catch (error) {
    console.error("Error calculating rewards:", error)
    return {
      potentialRewards: 0,
      isLoading: false,
      error,
    }
  }
}
