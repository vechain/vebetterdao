import { gmNfts } from "@/constants/gmNfts"

type PotentialRewards = {
  potentialRewards: number
  error?: any
}

/**
 * Hook to calculate the potential rewards based on the GM level and the latest voted round
 * This calculator uses the VOT3 tokens delegated to the user.
 *
 * Note: This calculator is based on rounds that have already been voted.
 * Limitation: The formula will not count the rewards of the current or upcoming rounds.
 *
 */
export const usePotentialRewards = (
  cycleToTotal: number,
  emissionAmount_voterRewards: number,
  cycleToVoterToTotal?: number,
  GMlevel?: any,
  GMUserLevel?: any,
): PotentialRewards => {
  const gm = gmNfts.find((nft: { level: any }) => nft.level === GMlevel)
  const GMMultiplier = gm?.multiplier

  if (!cycleToTotal || !emissionAmount_voterRewards || !cycleToVoterToTotal || !GMlevel || !GMMultiplier) {
    return {
      potentialRewards: 0,
    }
  }

  const increase = cycleToVoterToTotal * (GMMultiplier / 100)
  let potentialRewards
  switch (true) {
    case Number(GMUserLevel) === Number(GMlevel):
      potentialRewards = (cycleToVoterToTotal / Number(cycleToTotal)) * emissionAmount_voterRewards
      break
    case Number(GMUserLevel) < Number(GMlevel): {
      const cycleToVoterToTotal_enhanced = cycleToVoterToTotal + increase
      const cycleToTotal_enhanced = Number(cycleToTotal) + increase
      potentialRewards = (cycleToVoterToTotal_enhanced / Number(cycleToTotal_enhanced)) * emissionAmount_voterRewards
      break
    }
    default:
      potentialRewards = 0
      break
  }

  return { potentialRewards: potentialRewards ?? 0 }
}
