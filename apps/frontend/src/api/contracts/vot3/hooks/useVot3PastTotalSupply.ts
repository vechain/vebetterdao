import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { VOT3__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"
import { EnvConfig } from "@repo/config/contracts"

/**
 * Get the total supply of VOT3 at a given timepoint (in the past)
 * @param thor - The thor instance
 * @param env - The environment config
 * @param timepoint - The timepoint to get the total supply at (block)
 * @returns The total supply of VOT3 at the given timepoint
 */
export const getVot3PastTotalSupply = async (
  thor: ThorClient,
  env: EnvConfig,
  timepoint?: number | string,
): Promise<string> => {
  if (!timepoint) return Promise.reject(new Error("Timepoint is required"))

  const vot3ContractAddress = getConfig(env).vot3ContractAddress

  const res = await thor.contracts.load(vot3ContractAddress, VOT3__factory.abi).read.getPastTotalSupply(timepoint)

  if (!res) return Promise.reject(new Error("Past total supply call failed"))

  return ethers.formatEther(res[0] as bigint)
}

export const getVot3PastTotalSupplyQueryKey = (timepoint?: number | string) => ["vot3", "supplyAt", timepoint]

/**
 * Hook to get the total supply of VOT3 at a given timepoint (in the past)
 * @param env - The environment config
 * @param timepoint - The timepoint to get the total supply at (block)
 * @param enabled - Whether the query is enabled
 * @returns The total supply of VOT3 at the given timepoint
 */
export const useVot3PastSupply = (env: EnvConfig, timepoint?: number | string, enabled = true) => {
  const thor = useThor()

  return useQuery({
    queryKey: getVot3PastTotalSupplyQueryKey(timepoint),
    queryFn: () => getVot3PastTotalSupply(thor, env, timepoint),
    enabled: !!timepoint && enabled,
  })
}
