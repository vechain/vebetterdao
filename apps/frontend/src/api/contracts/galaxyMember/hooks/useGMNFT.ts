import { notFoundImage } from "@/constants"
import { useIsGMclaimable } from "./useIsGMclaimable"
import { useNFTImage } from "./useNFTImage"
import { useUserB3trBalance } from "../../b3tr"

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
  const { imageData, imageMetadata, isLoading: isGMLoading } = useNFTImage()
  const { data: b3trBalance } = useUserB3trBalance()

  //gm
  const gmImage = imageData?.image || notFoundImage
  const gmName = imageMetadata?.name

  // TODO: map data
  const gmLevel = 1
  const gmRewardMultiplier = "3"
  const nextLevelGMRewardMultiplier = "4"
  const b3trToUpgradeGMToNextLevel = 5000000

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
  }
}
