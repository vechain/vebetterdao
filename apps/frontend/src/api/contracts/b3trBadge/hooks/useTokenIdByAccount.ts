import { useQuery } from "@tanstack/react-query"
import { B3trBadgeContractJson } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
const b3trBadgeAbi = B3trBadgeContractJson.abi

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

export const getTokenIdByAccount = async (thor: Connex.Thor, address: null | string) => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionAbi = b3trBadgeAbi.find(e => e.name === "tokenOfOwnerByIndex")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for tokenOfOwnerByIndex"))
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(functionAbi).call(address, 0)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getTokenIdByAccountKey = (address: null | string) => ["TokenIdByAccount", "b3trBadge", address]
export const useTokenIdByAccount = (address: null | string, fetchNFT: boolean) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getTokenIdByAccountKey(address),
    queryFn: () => getTokenIdByAccount(thor, address),
    enabled: !!address && !!fetchNFT,
  })
}
