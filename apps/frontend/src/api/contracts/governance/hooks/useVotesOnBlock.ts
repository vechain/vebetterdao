import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { B3TRGovernorJson } from "@repo/contracts"
import { ethers } from "ethers"

const b3trGovernorAbi = B3TRGovernorJson.abi

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Get the number of votes of the given address (includes the delegated ones)
 * @param thor  the thor client
 * @param block the block number to get the votes at
 * @param address the address to get the votes of
 * @returns the votes of the given address
 */
export const getVotesOnBlock = async (
  thor: Connex.Thor,
  block?: number,
  address?: string,
): Promise<{
  original: string
  scaled: string
  formatted: string
}> => {
  if (!block) throw new Error("block is required")
  if (!address) throw new Error("address is required")

  const getVotesAbi = b3trGovernorAbi.find(abi => abi.name === "getVotes")
  if (!getVotesAbi) throw new Error("getVotes function not found")
  const res = await thor.account(GOVERNOR_CONTRACT).method(getVotesAbi).call(address, block)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = ethers.formatEther(original)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getVotesOnBlockQueryKey = (block?: number, address?: string) => ["votesOnBlock", block, address]
/**
 *  Hook to get the number of votes of the given address (includes the delegated ones)
 * @returns the number of votes of the given address (includes the delegated ones)
 */
export const useGetVotesOnBlock = (block?: number, address?: string, enabled = true) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVotesOnBlockQueryKey(block, address),
    queryFn: async () => await getVotesOnBlock(thor, block, address),
    enabled: !!thor && !!address && !!block && enabled,
  })
}
