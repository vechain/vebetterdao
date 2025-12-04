import { QueryKey, useQueryClient } from "@tanstack/react-query"
import { useWallet, EnhancedClause, useSendTransaction } from "@vechain/vechain-kit"
import { useCallback, useEffect, useMemo, useRef } from "react"

import { useTransactionModal, TransactionCustomUI } from "@/providers/TransactionModalProvider"

export type BuildTransactionProps<ClausesParams = void> = {
  clauseBuilder: (props: ClausesParams) => EnhancedClause[]
  refetchQueryKeys?: QueryKey[]
  onSuccess?: () => void
  invalidateCache?: boolean
  suggestedMaxGas?: number
  onFailure?: () => void
  transactionModalCustomUI?: TransactionCustomUI
  gasPadding?: number
}
/**
 * Custom hook for building and sending transactions.
 * @param clauseBuilder - A function that builds an array of enhanced clauses based on the provided parameters.
 * @param refetchQueryKeys - An optional array of query keys to refetch after the transaction is sent.
 * @param invalidateCache - A flag indicating whether to invalidate the cache and refetch queries after the transaction is sent.
 * @param onSuccess - An optional callback function to be called after the transaction is successfully sent.
 * @param onFailure - An optional callback function to be called after the transaction is failed or cancelled.
 * @param suggestedMaxGas - The suggested maximum gas for the transaction.
 * @param gasPadding - The padding to add to the suggested max gas. (Eg. 0.1 = 10%)
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
  gasPadding,
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
    if (invalidateCache && refetchQueryKeys?.length) {
      refetchQueryKeys?.forEach(async queryKey => {
        await queryClient.cancelQueries({ queryKey })
        await queryClient.refetchQueries({ queryKey })
      })
    }

    onSuccess?.()
  }, [invalidateCache, onSuccess, queryClient, refetchQueryKeys])

  const handleOnFailure = useCallback(
    (error: Error | string | undefined) => {
      //Catch async errors and manually update the modal
      if (lastReportedStatusRef.current === "error") return
      const errorReason = error instanceof Error ? error.message : error
      lastReportedStatusRef.current = "error"

      updateModal("error", "", {
        type: "SendTransactionError",
        reason: errorReason,
      })
      onFailure?.()
    },
    [onFailure, updateModal],
  )

  const result = useSendTransaction({
    signerAccountAddress: account?.address,
    onTxConfirmed: handleOnSuccess,
    suggestedMaxGas,
    onTxFailedOrCancelled: handleOnFailure,
    gasPadding,
  })

  const transactionStatus = useMemo(() => result?.status, [result?.status])
  const txID = useMemo(() => result?.txReceipt?.meta?.txID, [result?.txReceipt?.meta?.txID])
  const error = useMemo(() => result?.error, [result?.error])

  useEffect(() => {
    // We don't want to update the modal when the transaction is ready because it will re-render the modal in a loop / undesired way
    // Also, we don't want to update the modal when the status is the same as the last reported status unless there is an error
    const isSamePreviousStatus = transactionStatus === lastReportedStatusRef.current
    const hasError = !!error?.reason
    if ((isSamePreviousStatus && !hasError) || transactionStatus === "ready") {
      return
    }

    lastReportedStatusRef.current = transactionStatus
    updateModal(transactionStatus, txID, error)
  }, [transactionStatus, txID, error, updateModal])

  /**
   * Function to send a transaction based on the provided parameters.
   * @param props - The parameters to be passed to the `clauseBuilder` function.
   * @param overrideCustomUI - Optional custom UI to override the hook-level transactionModalCustomUI
   */
  const sendTransaction = useCallback(
    async (props?: ClausesParams, customUI?: TransactionCustomUI) => {
      const uiToUse = customUI ?? transactionModalCustomUI
      setupModal(async () => result.sendTransaction(clauseBuilder(props as any)), uiToUse)
      return result.sendTransaction(clauseBuilder(props as any))
    },
    [clauseBuilder, result, setupModal, transactionModalCustomUI],
  )

  return { ...result, sendTransaction }
}
