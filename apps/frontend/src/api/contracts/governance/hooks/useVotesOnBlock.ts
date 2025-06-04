import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"

/**
 * Get the number of votes of the given address (with decimals removed) - includes the delegated ones
 * @param thor - The thor client
 * @param env - The environment config
 * @param block - The block number to get the votes at
 * @param address - The address to get the votes of
 * @returns The votes of the given address (with decimals removed) - includes the delegated ones
 */
export const getVotesOnBlock = async (
  thor: ThorClient,
  env: EnvConfig,
  block?: number,
  address?: string,
): Promise<string> => {
  if (!block) throw new Error("block is required")
  if (!address) throw new Error("address is required")

  const governorContractAddress = getConfig(env).b3trGovernorAddress

  const res = await thor.contracts
    .load(governorContractAddress, B3TRGovernor__factory.abi)
    .read.getVotes(address, block)

  if (!res) return Promise.reject(new Error("Get votes call failed"))

  return ethers.formatEther(res[0] as bigint)
}

export const getVotesOnBlockQueryKey = (block?: number, address?: string) => ["votesOnBlock", block, address]

/**
 * Hook to get the number of votes of the given address (with decimals removed) - includes the delegated ones
 * @param env - The environment config
 * @param block - The block number to get the votes at
 * @param address - The address to get the votes of
 * @param enabled - Whether the query is enabled
 * @returns The number of votes of the given address (with decimals removed) - includes the delegated ones
 */
export const useGetVotesOnBlock = (env: EnvConfig, block?: number, address?: string, enabled = true) => {
  const thor = useThor()

  return useQuery({
    queryKey: getVotesOnBlockQueryKey(block, address),
    queryFn: async () => await getVotesOnBlock(thor, env, block, address),
    enabled: !!thor && !!address && !!block && enabled,
  })
}
