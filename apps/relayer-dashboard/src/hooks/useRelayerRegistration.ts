"use client"

import { useCallClause } from "@vechain/vechain-kit"

import { relayerPoolAbi, relayerPoolAddress } from "./contracts"

/** Check if an address is a registered relayer. */
export function useRelayerRegistration(address: string | undefined) {
  return useCallClause({
    abi: relayerPoolAbi,
    address: relayerPoolAddress,
    method: "isRegisteredRelayer",
    args: [address as `0x${string}`],
    queryOptions: {
      enabled: !!address,
      select: (data: readonly unknown[]) => data[0] as boolean,
    },
  })
}
