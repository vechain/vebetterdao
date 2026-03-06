"use client"

import { useCallClause } from "@vechain/vechain-kit"

import { relayerPoolAbi, relayerPoolAddress } from "./contracts"

/**
 * All currently registered relayer addresses from RelayerRewardsPool.getRegisteredRelayers().
 */
export function useRegisteredRelayers() {
  const result = useCallClause({
    abi: relayerPoolAbi,
    address: relayerPoolAddress,
    method: "getRegisteredRelayers",
    args: [],
    queryOptions: {
      select: (data: readonly unknown[]) => (Array.isArray(data[0]) ? (data[0] as string[]) : []),
    },
  })

  return {
    relayers: result.data,
    count: result.data?.length ?? 0,
    isLoading: result.isLoading,
  }
}
