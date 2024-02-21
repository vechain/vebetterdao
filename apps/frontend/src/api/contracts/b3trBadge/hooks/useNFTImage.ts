import { useWallet } from "@vechain/dapp-kit-react"
import { useTokenIdByAccount } from "./useTokenIdByAccount"
import { useNFTMetadataUri } from "./useNFTMetadataUri"
import { useIpfsNftImage } from "@/hooks/useIpfsNftImage"
import { useIpfsMetadata } from "@/hooks/useIpfsMetadata"

/**
 * Fetches NFT image from IPFS
 * @param fetchNFT - Whether to fetch the NFT
 * @returns The NFT image
 */

export const useNFTImage = (fetchNFT: boolean) => {
  const { account } = useWallet()
  const {
    data: tokenID,
    isLoading: isLoadingTokenID,
    isError: isErrorTokenID,
    error: errorTokenID,
  } = useTokenIdByAccount(account, fetchNFT)
  if (errorTokenID) {
    console.error("errorTokenID", errorTokenID)
  }
  const {
    data: metadataURI,
    isLoading: isLoadingMetadataUri,
    isError: isErrorMetadataUri,
    error: errorMetadataURI,
  } = useNFTMetadataUri(tokenID)
  if (errorMetadataURI) {
    console.error("errorMetadataURI", errorMetadataURI)
  }
  const {
    data: imageMetadata,
    isLoading: isLoadingMetadata,
    isError: isErrorMetadata,
    error: errorMetadata,
  } = useIpfsMetadata(metadataURI ?? null)
  if (errorMetadata) {
    console.error("errorMetadata", errorMetadata)
  }
  const {
    data: imageData,
    isLoading: isLoadingImageData,
    isError: isErrorImageData,
    error: errorImageData,
  } = useIpfsNftImage(imageMetadata?.image ?? null)
  if (errorImageData) {
    console.error("errorImageData", errorImageData)
  }

  return {
    imageData,
    imageMetadata,
    isLoading: isLoadingTokenID ?? isLoadingMetadataUri ?? isLoadingMetadata ?? isLoadingImageData,
    isError: isErrorTokenID ?? isErrorMetadataUri ?? isErrorMetadata ?? isErrorImageData,
    error: errorTokenID ?? errorMetadataURI ?? errorMetadata ?? errorImageData,
  }
}
