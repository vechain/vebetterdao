import {
  getB3TrBalanceQueryKey,
  useB3trTokenDetails,
  buildStakeB3trTx,
  getVot3BalanceQueryKey,
  buildB3trApprovesVot3ContractTx,
} from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { FormattingUtils } from "@repo/utils"

type useMintB3trProps = {
  amount?: string | number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to stake a certain amount of B3TR tokens
 * This hook will stake the tokens and wait for the txConfirmation
 * @param amount the amount of tokens to stake. Should not already include decimals
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useStakeB3tr = ({
  amount,
  onSuccess,
  invalidateCache = true,
}: useMintB3trProps): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: tokenDetails } = useB3trTokenDetails()

  const buildClauses = useCallback(() => {
    if (!amount) throw new Error("amount is required")
    if (!tokenDetails) throw new Error("tokenDetails is required")
    const approveClause = buildB3trApprovesVot3ContractTx(thor, amount, tokenDetails.decimals)
    const stakeClause = buildStakeB3trTx(thor, amount, tokenDetails.decimals)
    return [approveClause, stakeClause]
  }, [thor, amount, tokenDetails])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })
      await queryClient.cancelQueries({
        queryKey: getVot3BalanceQueryKey(account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getVot3BalanceQueryKey(account ?? undefined),
      })
    }

    const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)

    toast({
      title: "Tokens staked succesfully",
      description: `You have staked ${formattedAmount} B3TR`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, account, amount])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
