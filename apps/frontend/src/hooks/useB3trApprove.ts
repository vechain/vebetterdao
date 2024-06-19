import { buildB3trApprovesTx } from "@/api"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { getB3TrAllowanceQueryKey } from "@/api/contracts/b3tr/hooks/useB3trAllowance"
import { useQueryClient } from "@tanstack/react-query"

type useB3trApproveProps = {
  spender: string
  amount?: string | number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

export const useB3trApprove = ({
  spender,
  amount,
  onSuccess,
  invalidateCache = true,
}: useB3trApproveProps): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    if (amount === undefined) throw new Error("amount is required")

    const approveClause = buildB3trApprovesTx(thor, amount, spender)
    return [approveClause]
  }, [thor, amount, spender])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getB3TrAllowanceQueryKey(account ?? undefined, spender),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrAllowanceQueryKey(account ?? undefined, spender),
      })
    }

    onSuccess?.()
  }, [invalidateCache, onSuccess, account, spender, queryClient])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
