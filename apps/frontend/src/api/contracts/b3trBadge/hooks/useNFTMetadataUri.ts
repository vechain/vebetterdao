import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { B3TRBadge__factory } from "@repo/contracts"

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

export const getNFTMetadataUri = async (thor: Connex.Thor, tokenID: null | string): Promise<string> => {
  if (!tokenID) return Promise.reject(new Error("tokenID not provided"))

  const functionFragment = B3TRBadge__factory.createInterface().getFunction("tokenURI").format("json")
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(JSON.parse(functionFragment)).call(tokenID)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getNFTMetadataUriQueryKey = (tokenID: null | string) => ["tokenURI", "b3trBadge", tokenID]

/**
 * Get the metadata URI for an NFT
 * @param tokenID the token ID to get the metadata URI for
 * @returns the metadata URI for the token
 */
export const useNFTMetadataUri = (tokenID: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getNFTMetadataUriQueryKey(tokenID),
    queryFn: () => getNFTMetadataUri(thor, tokenID),
    enabled: !!tokenID,
  })
}
