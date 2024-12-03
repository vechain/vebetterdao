import { NFTMetadata, useIpfsImage, useIpfsMetadata } from "@/api"
import { notFoundImage } from "@/constants"
import { useGMBaseUri } from "./useGMBaseUri"

export const useNextLevelImage = (gmLevel: number) => {
  // Fetch the base URI
  const { data: baseUri, isLoading: baseUriLoading } = useGMBaseUri()

  // Construct the URI for the next level GM NFT metadata
  const isValidGmLevel = typeof gmLevel === "number" && !isNaN(gmLevel)
  const nextLevelGMMetadataUri = isValidGmLevel && baseUri ? `${baseUri}${gmLevel + 1}.json` : undefined

  // Fetch the next level GM NFT metadata
  const { data: nextLevelGMMetadata, isLoading: nextLevelGMMetadataLoading } =
    useIpfsMetadata<NFTMetadata>(nextLevelGMMetadataUri)

  // Fetch the next level GM NFT image
  const { data: nextLevelGMImage, isLoading: nextLevelGMImageLoading } = useIpfsImage(
    nextLevelGMMetadata?.image ?? null,
  )

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

// TODO
// * hook - remove console.log
// * modal - refactor nft border
// * modal - refactor paddings/margins
// * modal - add nft id to title
// * gms page - width of the card
// * generate translation
// * pr screenshots
