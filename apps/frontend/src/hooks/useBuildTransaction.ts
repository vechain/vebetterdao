import { useCallback } from "react"
import { EnhancedClause, useSendTransaction } from "./useSendTransaction"
import { useWallet } from "@vechain/dapp-kit-react"
import { useQueryClient } from "@tanstack/react-query"

export type BuildTransactionProps<ClausesParams> = {
  clauseBuilder: (props: ClausesParams) => EnhancedClause[]
  refetchQueryKeys?: string[][]
  onSuccess?: () => void
  invalidateCache?: boolean
}

/**
 * Custom hook for building and sending transactions.
 * @param clauseBuilder - A function that builds an array of enhanced clauses based on the provided parameters.
 * @param refetchQueryKeys - An optional array of query keys to refetch after the transaction is sent.
 * @param invalidateCache - A flag indicating whether to invalidate the cache and refetch queries after the transaction is sent.
 * @param onSuccess - An optional callback function to be called after the transaction is successfully sent.
 * @returns An object containing the result of the `useSendTransaction` hook and a `sendTransaction` function.
 */
export const useBuildTransaction = <ClausesParams>({
  clauseBuilder,
  refetchQueryKeys,
  invalidateCache = true,
  onSuccess,
}: BuildTransactionProps<ClausesParams>) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

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
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  /**
   * Function to send a transaction based on the provided parameters.
   * @param props - The parameters to be passed to the `clauseBuilder` function.
   */
  const sendTransaction = useCallback(
    (props: ClausesParams) => {
      result.sendTransaction(clauseBuilder(props))
    },
    [clauseBuilder, result],
  )

  return { ...result, sendTransaction }
}
