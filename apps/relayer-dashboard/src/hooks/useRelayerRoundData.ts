"use client"

import { useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "viem"

import { relayerPoolAbi, relayerPoolAddress } from "./contracts"

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
})

/** Per-relayer data for a specific round: claimable rewards, weighted actions, total actions. */
export function useRelayerRoundData(relayerAddress: string | undefined, roundId: number | undefined) {
  const enabled = !!relayerAddress && roundId != null

  const claimable = useCallClause({
    abi: relayerPoolAbi,
    address: relayerPoolAddress,
    method: "claimableRewards",
    args: [relayerAddress ?? "0x0000000000000000000000000000000000000000", BigInt(roundId ?? 0)],
    queryOptions: {
      enabled,
      select: (data: readonly unknown[]) => (data[0] != null ? (data[0] as bigint) : undefined),
    },
  })

  const weightedActions = useCallClause({
    abi: relayerPoolAbi,
    address: relayerPoolAddress,
    method: "totalRelayerWeightedActions",
    args: [relayerAddress ?? "0x0000000000000000000000000000000000000000", BigInt(roundId ?? 0)],
    queryOptions: {
      enabled,
      select: (data: readonly unknown[]) => (data[0] != null ? Number(data[0]) : undefined),
    },
  })

  const actions = useCallClause({
    abi: relayerPoolAbi,
    address: relayerPoolAddress,
    method: "totalRelayerActions",
    args: [relayerAddress ?? "0x0000000000000000000000000000000000000000", BigInt(roundId ?? 0)],
    queryOptions: {
      enabled,
      select: (data: readonly unknown[]) => (data[0] != null ? Number(data[0]) : undefined),
    },
  })

  return {
    claimableWei: claimable.data,
    claimableFormatted: claimable.data != null ? `${compact.format(Number(formatEther(claimable.data)))} B3TR` : undefined,
    weightedActions: weightedActions.data,
    actions: actions.data,
    isLoading: claimable.isLoading || weightedActions.isLoading || actions.isLoading,
  }
}
