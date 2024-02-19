import { useQuery } from "@tanstack/react-query"
import { B3trBadgeContractJson } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
const b3trBadgeAbi = B3trBadgeContractJson.abi

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

export const getNFTMetadataUri = async (thor: Connex.Thor, tokenID: null | string): Promise<string> => {
  if (!tokenID) return Promise.reject(new Error("tokenID not provided"))

  const functionAbi = b3trBadgeAbi.find(e => e.name === "tokenURI")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for tokenURI"))
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(functionAbi).call(tokenID)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getNFTMetadataUriKey = (tokenID: null | string) => ["tokenURI", "b3trBadge", tokenID]
export const useNFTMetadataUri = (tokenID: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getNFTMetadataUriKey(tokenID),
    queryFn: () => getNFTMetadataUri(thor, tokenID),
    enabled: !!tokenID,
  })
}
