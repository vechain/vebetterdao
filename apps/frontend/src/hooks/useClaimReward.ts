import { buildClaimRoundReward, getB3TrBalanceQueryKey, getRoundRewardQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
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

    const clauses = buildClaimRoundReward(roundId, account ?? "")
    return [clauses]
  }, [account, roundId])

  // Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getRoundRewardQueryKey(roundId, account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getRoundRewardQueryKey(roundId, account ?? undefined),
      })
    }

    await queryClient.cancelQueries({
      queryKey: getB3TrBalanceQueryKey(account ?? ""),
    })

    await queryClient.refetchQueries({
      queryKey: getB3TrBalanceQueryKey(account ?? ""),
    })

    onSuccess?.()
  }, [account, invalidateCache, onSuccess, queryClient, roundId])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
    onTxFailedOrCancelled: onFailure,
  })

  const onMutate = useCallback(async () => {
    const clauses = buildClauses()
    return result.sendTransaction(clauses)
  }, [buildClauses, result])

  return { ...result, sendTransaction: onMutate }
}
