import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { B3TRBadge__factory } from "@repo/contracts"

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

/**
 * Get the token ID for an address
 * @param thor the thor instance
 * @param address the address to get the token ID for
 * @returns the token ID for the address
 */

export const getTokenIdByAccount = async (thor: Connex.Thor, address: null | string) => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionFragment = B3TRBadge__factory.createInterface().getFunction("balanceOf").format("json")
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(JSON.parse(functionFragment)).call(address, 0)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getTokenIdByAccountQueryKey = (address: null | string) => ["TokenIdByAccount", "b3trBadge", address]

/**
 * Get the number of b3tr badges for an address
 * @param address the address to get the number of b3tr badges for
 * @returns the number of b3tr badges for the address
 */
export const useTokenIdByAccount = (address: null | string, fetchNFT: boolean) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getTokenIdByAccountQueryKey(address),
    queryFn: () => getTokenIdByAccount(thor, address),
    enabled: !!address && !!fetchNFT,
  })
}
