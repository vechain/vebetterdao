import { ProposalDeposit, buildClaimDepositsTx, getProposalDepositKey, getVot3BalanceQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { address } from "thor-devkit"

/**
 * Type definition for properties accepted by the `useWithdrawDeposits` hook.
 */
type useClaimRewardsProps = {
  proposalDeposits: ProposalDeposit[]
  onSuccess?: () => void
  onFailure?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

/**
 * Type definition for the return value of the `useWithdrawDeposits` hook.
 */
type useClaimRewardsReturnValue = {
  sendTransaction: () => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * A custom React hook that enables a user to withdraw deposits associated with proposals.
 * The hook provides functionality to send transactions for withdrawing deposits and to optionally
 * invalidate and refresh related data in the cache upon successful transaction confirmation.
 *
 * @param proposalDeposits - An array of `ProposalDeposit` that specifies the deposits to withdraw.
 * @param onSuccess - Optional callback to be executed upon successful transaction confirmation.
 * @param onFailure - Optional callback to be executed if the transaction fails or is cancelled.
 * @param invalidateCache - Flag to determine whether to invalidate and refresh the related cache. Defaults to true.
 * @returns An object containing functions and properties for transaction management.
 */
export const useWithdrawDeposits = ({
  proposalDeposits,
  onSuccess,
  onFailure,
  invalidateCache = true,
}: useClaimRewardsProps): useClaimRewardsReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    if (!address) throw new Error("address is required")

    const clauses = buildClaimDepositsTx(proposalDeposits, account ?? "")

    return clauses
  }, [account, proposalDeposits])

  // Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      for (const proposalDeposit of proposalDeposits) {
        await queryClient.cancelQueries({
          queryKey: getProposalDepositKey(proposalDeposit.proposalId, account ?? ""),
        })
        await queryClient.refetchQueries({
          queryKey: getProposalDepositKey(proposalDeposit.proposalId, account ?? ""),
        })
      }

      await queryClient.cancelQueries({
        queryKey: getVot3BalanceQueryKey(account ?? ""),
      })

      await queryClient.refetchQueries({
        queryKey: getVot3BalanceQueryKey(account ?? ""),
      })
    }

    onSuccess?.()
  }, [account, invalidateCache, onSuccess, proposalDeposits, queryClient])

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
