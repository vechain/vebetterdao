import { useWallet } from "@vechain/vechain-kit"

import { useNFTMetadataUri } from "./useNFTMetadataUri"
import { useTokenIdByAccount } from "./useTokenIdByAccount"

import { useIpfsImage } from "@/api/ipfs/hooks/useIpfsImage"
import { useIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"

/**
 * Fetches NFT image from IPFS
 * @param fetchNFT - Whether to fetch the NFT
 * @returns The NFT image
 */
export type NFTMetadata = {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string
  }[]
}
export const useNFTImage = (profile?: string) => {
  const { account } = useWallet()
  const {
    data: tokenID,
    isLoading: isLoadingTokenID,
    isError: isErrorTokenID,
    error: errorTokenID,
  } = useTokenIdByAccount(profile ?? account?.address ?? "", 0)
  const {
    data: metadataURI,
    isLoading: isLoadingMetadataUri,
    isError: isErrorMetadataUri,
    error: errorMetadataURI,
  } = useNFTMetadataUri(tokenID)
  const {
    data: imageMetadata,
    isLoading: isLoadingMetadata,
    isError: isErrorMetadata,
    error: errorMetadata,
  } = useIpfsMetadata<NFTMetadata>(metadataURI)
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
