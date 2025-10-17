import { gmNfts } from "@/constants/gmNfts"

import { GMLevelOverview } from "../../../indexer/gm/useGMLevelsOverview"

type PotentialRewards = {
  potentialRewards: number
  currentRewards: number
  error?: any
}
/**
 * Calculates both the current and potential GM rewards:
 * - `currentRewards`: what user earns with current level
 * - `potentialRewards`: what they'd earn if they switched to selected level
 */
export const usePotentialRewardsFromIndexer = (
  gmLevelOverview: GMLevelOverview[],
  emissionAmount_gmRewards: number,
  selectedLevel: string,
  currentLevel?: string,
): PotentialRewards => {
  const selected = gmNfts.find(nft => nft.level === selectedLevel)
  const existing = gmNfts.find(nft => nft.level === currentLevel)
  if (!selected || !emissionAmount_gmRewards || !gmLevelOverview?.length) {
    return { potentialRewards: 0, currentRewards: 0 }
  }
  try {
    const scaledSelectedWeight = selected.multiplier * 100
    const scaledExistingWeight = existing && existing.name.toUpperCase() !== "EARTH" ? existing.multiplier * 100 : 0
    const totalGMWeight = gmLevelOverview.reduce((acc, levelData) => {
      if (levelData.level.toUpperCase() === "EARTH") return acc
      const levelInfo = gmNfts.find(n => n.name.toUpperCase() === levelData.level.toUpperCase())
      if (!levelInfo) return acc
      const scaled = levelInfo.multiplier * 100
      return acc + levelData.totalNFTs * scaled
    }, 0)
    // Rewards with upgraded level
    const adjustedTotalWeight = totalGMWeight - scaledExistingWeight + scaledSelectedWeight
    const potentialRewards = (scaledSelectedWeight * emissionAmount_gmRewards) / adjustedTotalWeight
    // Rewards with current level (unadjusted)
    const currentRewards = (scaledExistingWeight * emissionAmount_gmRewards) / totalGMWeight
    return {
      potentialRewards,
      currentRewards,
    }
  } catch (error) {
    return { potentialRewards: 0, currentRewards: 0, error }
  }
}
