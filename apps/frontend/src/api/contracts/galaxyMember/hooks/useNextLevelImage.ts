import { NFTMetadata, useIpfsImage, useIpfsMetadata } from "@/api"
import { notFoundImage } from "@/constants"
import { useGMBaseUri } from "./useGMBaseUri"

export const useNextLevelImage = (gmLevel: number) => {
  // Fetch the base URI
  const { data: baseUri, isLoading: baseUriLoading } = useGMBaseUri()

  // Construct the URI for the next level GM NFT metadata
  const isValidGmLevel = typeof gmLevel === "number" && !isNaN(gmLevel)
  const nextLevelGMMetadataUri = isValidGmLevel && baseUri ? `${baseUri}${gmLevel + 1}.json` : undefined
  console.log("***************nextLevelGMMetadataUri", nextLevelGMMetadataUri)

  // Fetch the next level GM NFT metadata
  const { data: nextLevelGMMetadata, isLoading: nextLevelGMMetadataLoading } =
    useIpfsMetadata<NFTMetadata>(nextLevelGMMetadataUri)
  console.log("***************nextLevelGMMetadata", nextLevelGMMetadata)

  // Fetch the next level GM NFT image
  const { data: nextLevelGMImage, isLoading: nextLevelGMImageLoading } = useIpfsImage(
    nextLevelGMMetadata?.image ?? null,
  )
  console.log("***************nextLevelGMImage", nextLevelGMImage)

  // Determine loading state
  const isLoading = baseUriLoading || nextLevelGMMetadataLoading || nextLevelGMImageLoading

  // Return the next level GM NFT image
  if (!isValidGmLevel) {
    return {
      isLoading: false,
      nextLevelGMImage: notFoundImage,
    }
  }

  return {
    isLoading,
    nextLevelGMImage: nextLevelGMImage?.image || notFoundImage,
  }
}
