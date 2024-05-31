import {
  getB3TrBalanceQueryKey,
  useB3trTokenDetails,
  getVot3BalanceQueryKey,
  buildConvertVot3Tx,
  getVotesQueryKey,
  getB3TrTokenDetailsQueryKey,
} from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback, useMemo } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { removingExcessDecimals } from "@/utils/MathUtils"

const config = getConfig()

type useMintB3trProps = {
  amount?: string | number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to convert VOT3 tokens to B3TR tokens
 * This hook will convert the tokens and wait for the txConfirmation
 * @param amount the amount of tokens to convert. Should not already include decimals
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useConvertVot3 = ({
  amount,
  onSuccess,
  invalidateCache = true,
}: useMintB3trProps): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const { data: tokenDetails } = useB3trTokenDetails()
  const contractAmount = useMemo(() => removingExcessDecimals(amount, tokenDetails?.decimals), [amount, tokenDetails])

  const buildClauses = useCallback(() => {
    if (!contractAmount) throw new Error("amount is required")
    if (!tokenDetails) throw new Error("tokenDetails is required")
    const convertVot3Clause = buildConvertVot3Tx(thor, contractAmount, tokenDetails.decimals)
    return [convertVot3Clause]
  }, [thor, contractAmount, tokenDetails])

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
  }, [invalidateCache, queryClient, onSuccess, account])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
