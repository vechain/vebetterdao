"use client"

import { useWallet } from "@vechain/vechain-kit"

import { useCurrentRoundId } from "./useCurrentRoundId"
import { useRoundRewardStatus } from "./useRoundRewardStatus"

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
