import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import Contract from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import { getConfig } from "@repo/config"
const vot3Abi = Contract.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Get the number of votes of the given address (includes the delegated ones)
 * @param thor  the thor client
 * @returns the votes of the given address
 */
export const getVotes = async (thor: Connex.Thor, address?: string) => {
  if (!address) throw new Error("address is required")

  const getVotesAbi = vot3Abi.find(abi => abi.name === "getVotes")
  if (!getVotesAbi) throw new Error("getVotes function not found")
  const res = await thor.account(VOT3_CONTRACT).method(getVotesAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getVotesQueryKey = (address?: string) => ["votes", address]
/**
 *  Hook to get the number of votes of the given address (includes the delegated ones)
 * @returns the number of votes of the given address (includes the delegated ones)
 */
export const useGetVotes = (address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVotesQueryKey(address),
    queryFn: async () => await getVotes(thor, address),
    enabled: !!thor && !!address,
  })
}
