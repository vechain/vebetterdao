import { NFTMetadata } from "@/api/contracts/galaxyMember/hooks/useNFTImage"
import { useNFTMetadataUri } from "@/api/contracts/galaxyMember/hooks/useNFTMetadataUri"
import { notFoundImage } from "@/constants"
import { gmNfts } from "@/constants/gmNfts"

import { useLevelMultiplier } from "../api/contracts/galaxyMember/hooks/useLevelMultiplier"
import { useLevelOfToken } from "../api/contracts/galaxyMember/hooks/useLevelOfToken"
import { useIpfsImage } from "../api/ipfs/hooks/useIpfsImage"
import { useIpfsMetadata } from "../api/ipfs/hooks/useIpfsMetadata"

/**
 * Custom hook to fetch and process GM NFT data
 * @param tokenId The GM NFT token ID
 * @returns Object containing GM NFT data and loading state
 */
export const useGMNFTData = (tokenId?: string) => {
  const { data: metadataURI, isLoading: isLoadingMetadataUri } = useNFTMetadataUri(tokenId)
  const { data: imageMetadata, isLoading: isLoadingMetadata } = useIpfsMetadata<NFTMetadata>(metadataURI)
  const { data: imageData, isLoading: isLoadingImageData } = useIpfsImage(imageMetadata?.image ?? null)
  const { data: gmLevel, isLoading: isLevelOfTokenLoading } = useLevelOfToken(tokenId ?? undefined)
  const { data: gmRewardMultiplier, isLoading: isGMLoadingMultiplier } = useLevelMultiplier(gmLevel)
  const isLoading =
    isLoadingMetadataUri || isLoadingMetadata || isLoadingImageData || isLevelOfTokenLoading || isGMLoadingMultiplier
  const gmImage = imageData?.image || gmNfts[Number(gmLevel) - 1]?.image || notFoundImage
  const nftName = imageMetadata?.name || gmNfts[Number(gmLevel) - 1]?.name
  const gmName = `${nftName} #${tokenId}`
  return {
    gmImage,
    gmName,
    nftName,
    gmLevel,
    gmRewardMultiplier,
    isLoading,
  }
}
