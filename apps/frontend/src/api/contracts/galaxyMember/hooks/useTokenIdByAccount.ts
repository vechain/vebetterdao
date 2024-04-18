import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { GalaxyMember__factory } from "@repo/contracts"

const GALAXY_MEMBER_CONTRACT = getConfig().galaxyMemberContractAddress

/**
 * Get the token ID for an address given an index
 * @param thor the thor instance
 * @param address the address to get the token ID for
 * @param index the index of the token ID
 *
 * @returns the token ID for the address
 */

export const getTokenIdByAccount = async (
  thor: Connex.Thor,
  address: null | string,
  index: number,
): Promise<string> => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionFragment = GalaxyMember__factory.createInterface().getFunction("tokenOfOwnerByIndex").format("json")
  const res = await thor.account(GALAXY_MEMBER_CONTRACT).method(JSON.parse(functionFragment)).call(address, index)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getTokenIdByAccountQueryKey = (address: null | string) => ["TokenIdByAccount", "galaxyMember", address]

/**
 * Get the token ID for an address given an index
 * @param address the address to get the token ID for
 * @param index the index of the token ID
 * 
 * @returns the token ID for the address
 */
export const useTokenIdByAccount = (address: null | string, index: number) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getTokenIdByAccountQueryKey(address),
    queryFn: () => getTokenIdByAccount(thor, address, index),
    enabled: !!address,
  })
}
