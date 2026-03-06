"use client"

import { useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "viem"

import { relayerPoolAbi, relayerPoolAddress } from "./contracts"

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
})

/**
 * For a given round, whether relayer rewards are claimable and total rewards in pool.
 */
export function useRoundRewardStatus(roundId: number | undefined) {
  const claimable = useCallClause({
    abi: relayerPoolAbi,
    address: relayerPoolAddress,
    method: "isRewardClaimable",
    args: [BigInt(roundId ?? 0)],
    queryOptions: {
      enabled: roundId != null,
      select: data => data[0] as boolean | undefined,
    },
  })

  const totalRewards = useCallClause({
    abi: relayerPoolAbi,
    address: relayerPoolAddress,
    method: "getTotalRewards",
    args: [BigInt(roundId ?? 0)],
    queryOptions: {
      enabled: roundId != null,
      select: data => (data[0] != null ? (data[0] as bigint) : undefined),
    },
  })

  return {
    claimable: claimable.data,
    totalRewardsWei: totalRewards.data,
    totalRewardsFormatted:
      totalRewards.data != null ? `${compactFormatter.format(Number(formatEther(totalRewards.data)))} B3TR` : undefined,
    isLoading: claimable.isLoading || totalRewards.isLoading,
  }
}
