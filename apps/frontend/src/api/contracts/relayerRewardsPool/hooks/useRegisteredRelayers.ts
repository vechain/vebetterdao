import { getConfig } from "@repo/config"
import { useCallClause } from "@vechain/vechain-kit"

import { relayerRewardsPoolAbi } from "../abi"

const address = getConfig().relayerRewardsPoolContractAddress as `0x${string}`
const abi = relayerRewardsPoolAbi

/**
 * Returns the list of all registered relayer addresses.
 */
export const useRegisteredRelayers = () => {
  return useCallClause({
    abi,
    address,
    method: "getRegisteredRelayers" as const,
    args: [],
    queryOptions: {
      select: (data: readonly unknown[]) => (data[0] as string[]).map(a => a.toLowerCase()),
    },
  })
}
