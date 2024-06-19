import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"

import { B3TRGovernor__factory } from "@repo/contracts"

const governorInterface = B3TRGovernor__factory.createInterface()

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Get the number of votes of the given address (with deciamls removed)  - includes the delegated ones
 * @param thor  the thor client
 * @param block the block number to get the votes at
 * @param address the address to get the votes of
 * @returns the votes of the given address (with deciamls removed)  - includes the delegated ones
 */
export const getVotesOnBlock = async (thor: Connex.Thor, block?: number, address?: string): Promise<string> => {
  if (!block) throw new Error("block is required")
  if (!address) throw new Error("address is required")

  const functionFragment = governorInterface.getFunction("getVotes").format("json")
  const res = await thor.account(GOVERNOR_CONTRACT).method(JSON.parse(functionFragment)).call(address, block)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return ethers.formatEther(res.decoded[0])
}

export const getVotesOnBlockQueryKey = (block?: number, address?: string) => ["votesOnBlock", block, address]
/**
 *  Hook to get the number of votes of the given address (with deciamls removed)  - includes the delegated ones
 * @returns the number of votes of the given address (with deciamls removed)  - includes the delegated ones
 */
export const useGetVotesOnBlock = (block?: number, address?: string, enabled = true) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVotesOnBlockQueryKey(block, address),
    queryFn: async () => await getVotesOnBlock(thor, block, address),
    enabled: !!thor && !!address && !!block && enabled,
  })
}
