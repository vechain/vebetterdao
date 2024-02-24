import { useB3trTokenDetails, buildB3trApprovesTx } from "@/api"
import { useToast } from "@chakra-ui/react"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { FormattingUtils } from "@repo/utils"

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

  const { data: tokenDetails } = useB3trTokenDetails()

  const buildClauses = useCallback(() => {
    if (!amount) throw new Error("amount is required")
    if (!tokenDetails) throw new Error("tokenDetails is required")

    const approveClause = buildB3trApprovesTx(thor, amount, tokenDetails.decimals, spender)
    return [approveClause]
  }, [thor, amount, tokenDetails])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)

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
