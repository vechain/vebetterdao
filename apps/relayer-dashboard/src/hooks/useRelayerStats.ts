"use client"

import { getConfig } from "@repo/config"
import { RelayerRewardsPool__factory, XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, useWallet } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const config = getConfig("mainnet")
const relayerPoolAddress = config.relayerRewardsPoolContractAddress as `0x${string}`
const xAllocationAddress = config.xAllocationVotingContractAddress as `0x${string}`
const relayerPoolAbi = RelayerRewardsPool__factory.abi
const xAllocationAbi = XAllocationVoting__factory.abi

export interface RoundClaimable {
  roundId: number
  claimable: boolean
  totalRewardsWei: bigint
  totalRewardsFormatted: string
}

/**
 * Current round ID from XAllocationVoting.
 */
export function useCurrentRoundId() {
  return useCallClause({
    abi: xAllocationAbi,
    address: xAllocationAddress,
    method: "currentRoundId",
    args: [],
    queryOptions: { select: data => (data[0] != null ? Number(data[0]) : undefined) },
  })
}

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
    totalRewardsFormatted: totalRewards.data != null ? `${formatEther(totalRewards.data)} B3TR` : undefined,
    isLoading: claimable.isLoading || totalRewards.isLoading,
  }
}

/**
 * Wallet connection and optional relayer-related on-chain data for the connected account.
 * Per-relayer historical stats (total claimed, VTHO spent) require an indexer.
 */
export function useRelayerStats() {
  const { account } = useWallet()
  const { data: currentRoundId } = useCurrentRoundId()

  const previousRoundId = currentRoundId != null ? currentRoundId - 1 : undefined
  const roundReward = useRoundRewardStatus(previousRoundId)

  return {
    address: account?.address,
    isConnected: !!account?.address,
    currentRoundId,
    previousRoundClaimable: roundReward.claimable,
    previousRoundRewards: roundReward.totalRewardsFormatted,
    previousRoundRewardsLoading: roundReward.isLoading,
  }
}
