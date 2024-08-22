import { notFoundImage } from "@/constants"
import { useIsGMclaimable } from "./useIsGMclaimable"
import { useNFTImage } from "./useNFTImage"
import { useUserB3trBalance } from "../../b3tr"
import { gmNfts } from "@/constants/gmNfts"

/**
 * Custom hook for retrieving data related to a Galaxy Member NFT.
 *
 * @returns An object containing the following properties:
 *   - gmImage: The image URL of the Galaxy Member NFT.
 *   - gmName: The name of the Galaxy Member NFT.
 *   - gmLevel: The level of the Galaxy Member NFT.
 *   - gmRewardMultiplier: The reward multiplier of the Galaxy Member NFT.
 *   - isGMLoading: A boolean indicating whether the Galaxy Member NFT data is currently being loaded.
 *   - isGMOwned: A boolean indicating whether the user owns the Galaxy Member NFT.
 *   - isGMClaimable: A boolean indicating whether the Galaxy Member NFT is claimable.
 */
export const useGMNFT = () => {
  const { isOwned: isGMOwned, isClaimable: isGMClaimable } = useIsGMclaimable()
  const { isLoading: isGMLoading } = useNFTImage()
  const { data: b3trBalance } = useUserB3trBalance()

  //gm

  // TODO: map data
  const isGMActive = false
  const gmLevel = 9
  const gmData = gmNfts[gmLevel]!
  const gmRewardMultiplier = gmData.multiplier
  const b3trToUpgradeGMToNextLevel = gmData.b3trToUpgrade
  const gmImage = gmData.image || notFoundImage
  const gmName = gmData.name
  const nextLevelGMRewardMultiplier = gmNfts[gmLevel + 1]?.multiplier

  const isEnoughBalanceToUpgradeGM = b3trBalance && Number(b3trBalance?.scaled || 0) >= b3trToUpgradeGMToNextLevel
  const missingB3trToUpgrade = b3trToUpgradeGMToNextLevel - Number(b3trBalance?.scaled || 0)

  return {
    gmImage,
    gmName,
    gmLevel,
    gmRewardMultiplier,
    nextLevelGMRewardMultiplier,
    isGMLoading,
    isGMOwned,
    isGMClaimable,
    b3trToUpgradeGMToNextLevel,
    isEnoughBalanceToUpgradeGM,
    missingB3trToUpgrade,
    isGMActive,
  }
}
