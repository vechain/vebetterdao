import { useCallback, useEffect, useMemo, useRef } from "react"
import { useWallet, EnhancedClause, useSendTransaction } from "@vechain/vechain-kit"
import { useQueryClient } from "@tanstack/react-query"
import { useTransactionModal, TransactionCustomUI } from "@/providers/TransactionModalProvider"

export type BuildTransactionProps<ClausesParams = void> = {
  clauseBuilder: (props: ClausesParams) => EnhancedClause[]
  refetchQueryKeys?: (string | undefined)[][]
  onSuccess?: () => void
  invalidateCache?: boolean
  suggestedMaxGas?: number
  onFailure?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * Custom hook for building and sending transactions.
 * @param clauseBuilder - A function that builds an array of enhanced clauses based on the provided parameters.
 * @param refetchQueryKeys - An optional array of query keys to refetch after the transaction is sent.
 * @param invalidateCache - A flag indicating whether to invalidate the cache and refetch queries after the transaction is sent.
 * @param onSuccess - An optional callback function to be called after the transaction is successfully sent.
 * @param onFailure - An optional callback function to be called after the transaction is failed or cancelled.
 * @param suggestedMaxGas - The suggested maximum gas for the transaction.
 * @returns An object containing the result of the `useSendTransaction` hook and a `sendTransaction` function.
 */
export const useBuildTransaction = <ClausesParams = void>({
  clauseBuilder,
  refetchQueryKeys,
  invalidateCache = true,
  onSuccess,
  onFailure,
  suggestedMaxGas,
  transactionModalCustomUI = {},
}: BuildTransactionProps<ClausesParams>) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()
  const { setupModal, updateModal } = useTransactionModal()
  const lastReportedStatusRef = useRef<string | undefined>()

  /**
   * Callback function to be called when the transaction is successfully confirmed.
   * It cancels and refetches the specified queries if `invalidateCache` is `true`.
   */
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      refetchQueryKeys?.forEach(async queryKey => {
        await queryClient.cancelQueries({
          queryKey,
        })
        await queryClient.refetchQueries({
          queryKey,
        })
      })
    }

    onSuccess?.()
  }, [invalidateCache, onSuccess, queryClient, refetchQueryKeys])

  const result = useSendTransaction({
    signerAccountAddress: account?.address,
    onTxConfirmed: handleOnSuccess,
    suggestedMaxGas,
    onTxFailedOrCancelled: onFailure,
  })

  const transactionStatus = useMemo(() => result?.status, [result?.status])
  const txID = useMemo(() => result?.txReceipt?.meta?.txID, [result?.txReceipt?.meta?.txID])

  useEffect(() => {
    // We don't want to update the modal when the transaction is ready because it will re-render the modal in a loop / undesired way
    // Also, we don't want to update the modal when the status is the same as the last reported status
    if (!transactionStatus || transactionStatus === lastReportedStatusRef.current || transactionStatus === "ready") {
      return
    }

    lastReportedStatusRef.current = transactionStatus
    updateModal(transactionStatus, txID)
  }, [transactionStatus, txID])

  /**
   * Function to send a transaction based on the provided parameters.
   * @param props - The parameters to be passed to the `clauseBuilder` function.
   */
  const sendTransaction = useCallback(
    async (props?: ClausesParams) => {
      setupModal(async () => result.sendTransaction(clauseBuilder(props as any)), transactionModalCustomUI)
      return result.sendTransaction(clauseBuilder(props as any))
    },
    [clauseBuilder, result, setupModal, transactionModalCustomUI],
  )

  return { ...result, sendTransaction }
}
