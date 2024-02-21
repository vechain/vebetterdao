import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { B3TRBadge__factory } from "@repo/contracts"

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

/**
 * Get the number of b3tr badges for an address
 * @param thor the connex instance
 * @param address the address to get the number of b3tr badges for
 * @returns the number of b3tr badges for the address
 */
export const getBalanceOf = async (thor: Connex.Thor, address: null | string) => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionFragment = B3TRBadge__factory.createInterface().getFunction("balanceOf").format("json")
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(JSON.parse(functionFragment)).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return Number(res.decoded[0])
}

export const getB3trBadgeBalanceQueryKey = (address: null | string) => ["balanceOf", "b3trBadge", address]

/**
 * Get the number of b3tr badges for an address
 * @param address the address to get the number of b3tr badges for
 * @returns the number of b3tr badges for the address
 */
export const useB3trBadgeBalance = (address: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getB3trBadgeBalanceQueryKey(address),
    queryFn: () => getBalanceOf(thor, address),
    enabled: !!address,
  })
}
