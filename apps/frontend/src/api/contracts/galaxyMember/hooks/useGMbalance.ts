import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { GalaxyMember__factory } from "@repo/contracts"

const GALAXY_MEMBER_CONTRACT = getConfig().galaxyMemberContractAddress

/**
 * Get the number of GM NFTs for an address
 * @param thor the connex instance
 * @param address the address to get the number of GM NFts
 * @returns the number of GM NFTs for the address
 */
export const getBalanceOf = async (thor: Connex.Thor, address: null | string) => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionFragment = GalaxyMember__factory.createInterface().getFunction("balanceOf").format("json")
  const res = await thor.account(GALAXY_MEMBER_CONTRACT).method(JSON.parse(functionFragment)).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return Number(res.decoded[0])
}

export const getGMbalanceQueryKey = (address: null | string) => ["balanceOf", "galaxyMember", address]

/**
 * Get the number of GM NFTs for an address
 * @param address the address to get the number of GM NFTs owned
 * @returns the number of GM NFTs for the address
 */
export const useGMbalance = (address: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getGMbalanceQueryKey(address),
    queryFn: () => getBalanceOf(thor, address),
    enabled: !!address,
  })
}
