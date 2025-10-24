import { useIpfsImage } from "../../../ipfs/hooks/useIpfsImage"
import { useIpfsMetadata } from "../../../ipfs/hooks/useIpfsMetadata"

import { useGMBaseUri } from "./useGMBaseUri"
import { NFTMetadata } from "./useNFTImage"

const notFoundImage = "/assets/images/image-not-found.webp"
/**
 * Custom hook to fetch the next level Galaxy Member (GM) NFT image.
 *
 * @param {number} gmLevel - The current GM level.
 * @returns {Object} An object containing:
 * - `isLoading` (boolean): Indicates if any of the data fetching is in progress.
 * - `nextLevelGMImage` (string): The URI of the next level GM NFT image or a fallback image if not found.
 */
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
