import {
  getB3TrBalanceQueryKey,
  useB3trTokenDetails,
  buildStakeB3trTx,
  getVot3BalanceQueryKey,
  getVotesQueryKey,
  buildB3trApprovesTx,
  getB3TrTokenDetailsQueryKey,
} from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"

const config = getConfig()

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
    const approveClause = buildB3trApprovesTx(thor, amount, config.vot3ContractAddress, tokenDetails.decimals)
    const stakeClause = buildStakeB3trTx(thor, amount, tokenDetails.decimals)
    return [approveClause, stakeClause]
  }, [thor, amount, tokenDetails])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      //b3tr user balance
      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })

      // vot3 balance
      await queryClient.cancelQueries({
        queryKey: getVot3BalanceQueryKey(account ?? undefined),
      })

      await queryClient.refetchQueries({
        queryKey: getVot3BalanceQueryKey(account ?? undefined),
      })

      //user votes
      await queryClient.cancelQueries({
        queryKey: getVotesQueryKey(account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getVotesQueryKey(account ?? undefined),
      })

      //global locked b3tr => vot3
      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(config.vot3ContractAddress),
      })

      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(config.vot3ContractAddress),
      })

      // b3tr balance and details
      await queryClient.cancelQueries({
        queryKey: getB3TrTokenDetailsQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: getB3TrTokenDetailsQueryKey(),
      })
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, account, amount])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
