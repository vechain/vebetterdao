import { buildClaimRoundReward, getB3TrBalanceQueryKey, getRoundRewardQueryKey } from "@/api"

import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { address } from "thor-devkit"
import { useBuildTransaction } from "./useBuildTransaction"

type useClaimRewardProps = {
  roundId: string // The round id to claim the reward for.
  onSuccess?: () => void
  onFailure?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

/**
 * Provides a React hook to claim rewards for a specific round using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 *
 * @param {useClaimRewardProps} params - The parameters required to claim the reward.
 */
export const useClaimReward = ({ roundId, onSuccess, onFailure }: useClaimRewardProps) => {
  const { account } = useWallet()

  const buildClauses = useCallback(() => {
    if (!address) throw new Error("address is required")

    const clauses = buildClaimRoundReward(roundId, account?.address ?? "")
    return [clauses]
  }, [account?.address, roundId])

  const refetchQueryKeys = useMemo(
    () => [
      getRoundRewardQueryKey(roundId, account?.address ?? undefined),
      getB3TrBalanceQueryKey(account?.address ?? ""),
    ],
    [account?.address, roundId],
  )
  return useBuildTransaction({
    clauseBuilder: buildClauses,
    onSuccess,
    onFailure,
    refetchQueryKeys,
  })
}
