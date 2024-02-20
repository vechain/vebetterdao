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
  const { data: tokenID, isLoading: isLoadingTokenID, isError: isErrorTokenID } = useTokenIdByAccount(account, fetchNFT)
  const { data: metadataURI, isLoading: isLoadingMetadataUri, isError: isErrorMetadataUri } = useNFTMetadataUri(tokenID)
  const {
    data: imageMetadata,
    isLoading: isLoadingMetadata,
    isError: isErrorMetadata,
    error: errorMetadata,
  } = useIpfsMetadata(metadataURI || null)
  const {
    data: imageData,
    isLoading: isLoadingImageData,
    isError: isErrorImageData,
  } = useIpfsNftImage(imageMetadata?.image || null)

  return {
    imageData,
    imageMetadata,
    isLoading: isLoadingTokenID || isLoadingMetadataUri || isLoadingMetadata || isLoadingImageData,
    isError: isErrorTokenID || isErrorMetadataUri || isErrorMetadata || isErrorImageData,
  }
}
