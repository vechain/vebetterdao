import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { VOT3__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Get the number of votes of the given address (includes the delegated ones)
 * @param thor - The thor client
 * @param address - The address to get votes for
 * @returns The votes of the given address
 */
export const getVotes = async (
  thor: ThorClient,
  address?: string,
): Promise<{
  original: string
  scaled: string
  formatted: string
}> => {
  if (!address) throw new Error("address is required")

  const res = await thor.contracts.load(VOT3_CONTRACT, VOT3__factory.abi).read.getVotes(address)

  if (!res) return Promise.reject(new Error("Get votes call failed"))

  const original = res[0].toString()
  const scaled = ethers.formatEther(res[0] as bigint)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getVotesQueryKey = (address?: string) => ["votes", address]

/**
 * Hook to get the number of votes of the given address (includes the delegated ones)
 * @param address - The address to get votes for
 * @returns The number of votes of the given address (includes the delegated ones)
 */
export const useGetVotes = (address?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getVotesQueryKey(address),
    queryFn: async () => await getVotes(thor, address),
    enabled: !!thor && !!address,
  })
}
