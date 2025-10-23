import { gmNfts } from "@/constants/gmNfts"

type PotentialRewards = {
  potentialRewards: number
  error?: any
}
/**
 * Simulates GM rewards for a user who may have already voted in this cycle.
 * Avoids re-applying multiplier already used.
 */
export const usePotentialRewards = (
  cycleToTotalGMWeight: number,
  emissionAmount_gmRewards: number,
  cycleToVoterToGMWeight: number,
  GMlevel?: string,
  GMUserLevel?: string, // level of GM NFT used already
): PotentialRewards => {
  const newGm = gmNfts.find((nft: { level: any }) => nft.level === GMlevel)
  const existingGm = gmNfts.find((nft: { level: any }) => nft.level === GMUserLevel)
  // Check if the new and existing GM levels are valid
  const newMultiplier = newGm?.multiplier
  const existingMultiplier = existingGm?.multiplier
  // Check if the multipliers are valid
  if (
    !newMultiplier ||
    !existingMultiplier ||
    !cycleToVoterToGMWeight ||
    !cycleToTotalGMWeight ||
    !emissionAmount_gmRewards ||
    !GMlevel ||
    !GMUserLevel
  ) {
    return { potentialRewards: 0 }
  }
  // Scale multipliers to mirror smart contract values
  const scaledNewMultiplier = newMultiplier * 100
  const scaledExistingMultiplier = existingMultiplier * 100
  // Determine if a user has voted more than once in the cycle
  const totalTimeVoted = cycleToVoterToGMWeight / scaledExistingMultiplier
  // Adjust the weights based on the new multiplier, removing the old multiplier
  const adjustedUserWeight =
    cycleToVoterToGMWeight - scaledExistingMultiplier * totalTimeVoted + scaledNewMultiplier * totalTimeVoted
  const adjustedTotalWeight =
    cycleToTotalGMWeight - scaledExistingMultiplier * totalTimeVoted + scaledNewMultiplier * totalTimeVoted

  // Determine the potential rewards
  const reward = (adjustedUserWeight * emissionAmount_gmRewards) / adjustedTotalWeight

  return { potentialRewards: reward }
}
