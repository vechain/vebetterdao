import { RoundReward, buildClaimRewardsTx, getB3TrBalanceQueryKey, getRoundRewardQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { address } from "thor-devkit"

type useClaimRewardsProps = {
  roundRewards: RoundReward[]
  onSuccess?: () => void
  onFailure?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

export type useClaimRewardsReturnValue = {
  sendTransaction: () => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * useClaimRewards is a custom hook that claims voting rewards for a given set of rounds.
 * It uses the useSendTransaction hook to send the transaction and the useQueryClient hook to invalidate the queries after the transaction.
 *
 * @param {useClaimRewardsProps} props - The properties for the hook.
 * @returns {useClaimRewardsReturnValue} An object containing the sendTransaction function and the return value of the useSendTransaction hook.
 */
export const useClaimRewards = ({
  roundRewards,
  onSuccess,
  onFailure,
  invalidateCache = true,
}: useClaimRewardsProps): useClaimRewardsReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(
    (roundRewards: RoundReward[]) => {
      if (!address) throw new Error("address is required")

      const clauses = buildClaimRewardsTx(roundRewards, account ?? "")
      return clauses
    },
    [account],
  )

  // Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      for (const roundReward of roundRewards) {
        await queryClient.cancelQueries({
          queryKey: getRoundRewardQueryKey(roundReward.roundId, account ?? undefined),
        })
        await queryClient.refetchQueries({
          queryKey: getRoundRewardQueryKey(roundReward.roundId, account ?? undefined),
        })
      }

      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? ""),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? ""),
      })
    }

    onSuccess?.()
  }, [account, invalidateCache, onSuccess, queryClient, roundRewards])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
    onTxFailedOrCancelled: onFailure,
  })

  const onMutate = useCallback(async () => {
    const clauses = buildClauses(roundRewards)
    return result.sendTransaction(clauses)
  }, [buildClauses, result, roundRewards])

  return { ...result, sendTransaction: onMutate }
}
