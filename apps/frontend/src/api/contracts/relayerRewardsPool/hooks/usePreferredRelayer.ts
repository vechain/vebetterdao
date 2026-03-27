import { getConfig } from "@repo/config"
import { useCallClause, getCallClauseQueryKeyWithArgs, useWallet } from "@vechain/vechain-kit"

import { relayerRewardsPoolAbi } from "../abi"

const address = getConfig().relayerRewardsPoolContractAddress as `0x${string}`
const abi = relayerRewardsPoolAbi
const method = "getPreferredRelayer" as const

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export const getPreferredRelayerQueryKey = (userAddress: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

/**
 * Returns the preferred relayer address (lowercase) for the connected user,
 * or undefined if none is set.
 */
export const usePreferredRelayer = () => {
  const { account } = useWallet()

  return useCallClause({
    abi,
    address,
    method,
    args: [(account?.address || "") as `0x${string}`],
    queryOptions: {
      enabled: !!account?.address,
      select: (data: readonly unknown[]) => {
        const addr = data[0] as string
        if (!addr || addr.toLowerCase() === ZERO_ADDRESS) return undefined
        return addr.toLowerCase()
      },
    },
  })
}
