import { useB3trTokenDetails, buildB3trApprovesTx } from "@/api"
import { useToast } from "@chakra-ui/react"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { FormattingUtils } from "@repo/utils"
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
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: tokenDetails } = useB3trTokenDetails()

  const buildClauses = useCallback(() => {
    if (amount === undefined) throw new Error("amount is required")
    if (!tokenDetails) throw new Error("tokenDetails is required")

    const approveClause = buildB3trApprovesTx(thor, amount, spender, tokenDetails.decimals)
    return [approveClause]
  }, [thor, amount, tokenDetails, spender])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)

    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getB3TrAllowanceQueryKey(account ?? undefined, spender),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrAllowanceQueryKey(account ?? undefined, spender),
      })
    }

    toast({
      title: "B3TR tokens approved succesfully",
      description: `You have approved ${formattedAmount} B3TR to be spent by ${spender}`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, toast, onSuccess, account, amount, spender])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
