import { buildClaimRoundReward, getB3TrBalanceQueryKey, getRoundRewardQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"

import { useCallback } from "react"
import { useSendTransaction, UseSendTransactionReturnValue, useWallet } from "@vechain/vechain-kit"
import { address } from "thor-devkit"

type useClaimRewardProps = {
  roundId: string // The round id to claim the reward for.
  onSuccess?: () => void
  onFailure?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

export type useClaimRewardReturnValue = {
  sendTransaction: () => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * Provides a React hook to claim rewards for a specific round using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 *
 * @param {useClaimRewardProps} params - The parameters required to claim the reward.
 * @returns {useClaimRewardReturnValue} An object containing the function to trigger the transaction and the transaction state.
 */
export const useClaimReward = ({
  roundId,
  onSuccess,
  onFailure,
  invalidateCache = true,
}: useClaimRewardProps): useClaimRewardReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    if (!address) throw new Error("address is required")

    const clauses = buildClaimRoundReward(roundId, account?.address ?? "")
    return [clauses]
  }, [account?.address, roundId])

  // Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getRoundRewardQueryKey(roundId, account?.address ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getRoundRewardQueryKey(roundId, account?.address ?? undefined),
      })
    }

    await queryClient.cancelQueries({
      queryKey: getB3TrBalanceQueryKey(account?.address ?? ""),
    })

    await queryClient.refetchQueries({
      queryKey: getB3TrBalanceQueryKey(account?.address ?? ""),
    })

    onSuccess?.()
  }, [account?.address, invalidateCache, onSuccess, queryClient, roundId])

  const result = useSendTransaction({
    signerAccount: account?.address,
    onTxConfirmed: handleOnSuccess,
    onTxFailedOrCancelled: onFailure,
  })

  const onMutate = useCallback(async () => {
    const clauses = buildClauses()
    return result.sendTransaction(clauses)
  }, [buildClauses, result])

  return { ...result, sendTransaction: onMutate }
}
