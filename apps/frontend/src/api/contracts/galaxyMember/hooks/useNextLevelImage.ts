import { NFTMetadata, useIpfsImage, useIpfsMetadata } from "@/api"
import { notFoundImage } from "@/constants"
import { useGMBaseUri } from "./useGMBaseUri"

export const useNextLevelImage = (gmLevel: number) => {
  // Validate gmLevel is a number
  if (typeof gmLevel !== "number" || isNaN(gmLevel)) {
    throw new Error("Invalid gmLevel: Must be a valid number.")
  }

  // Fetch the base URI
  const { data: baseUri, isLoading: baseUriLoading } = useGMBaseUri()

  // Construct the URI for the next level GM NFT metadata
  const nextLevelGMMetadataUri = baseUri ? `${baseUri}${gmLevel + 1}.json` : undefined
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

  const isLoading = baseUriLoading || nextLevelGMMetadataLoading || nextLevelGMImageLoading

  return {
    isLoading,
    nextLevelGMImage: nextLevelGMImage?.image || notFoundImage,
  }
}
