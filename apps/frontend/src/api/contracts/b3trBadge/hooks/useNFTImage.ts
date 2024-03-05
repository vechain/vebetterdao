import { useWallet } from "@vechain/dapp-kit-react"
import { useTokenIdByAccount } from "./useTokenIdByAccount"
import { useNFTMetadataUri } from "./useNFTMetadataUri"
import { useIpfsImage } from "@/api/ipfs/hooks/useIpfsImage"
import { useIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"

/**
 * Fetches NFT image from IPFS
 * @param fetchNFT - Whether to fetch the NFT
 * @returns The NFT image
 */

export const useNFTImage = () => {
  const { account } = useWallet()
  const {
    data: tokenID,
    isLoading: isLoadingTokenID,
    isError: isErrorTokenID,
    error: errorTokenID,
  } = useTokenIdByAccount(account)

  const {
    data: metadataURI,
    isLoading: isLoadingMetadataUri,
    isError: isErrorMetadataUri,
    error: errorMetadataURI,
  } = useNFTMetadataUri(tokenID ?? null)

  const {
    data: imageMetadata,
    isLoading: isLoadingMetadata,
    isError: isErrorMetadata,
    error: errorMetadata,
  } = useIpfsMetadata(metadataURI ?? null)

  const {
    data: imageData,
    isLoading: isLoadingImageData,
    isError: isErrorImageData,
    error: errorImageData,
  } = useIpfsImage(imageMetadata?.image ?? null)

  return {
    imageData,
    imageMetadata,
    tokenID,
    isLoading: isLoadingTokenID || isLoadingMetadataUri || isLoadingMetadata || isLoadingImageData,
    isError: isErrorTokenID ?? isErrorMetadataUri ?? isErrorMetadata ?? isErrorImageData,
    error: errorTokenID ?? errorMetadataURI ?? errorMetadata ?? errorImageData,
  }
}
