import {
  getB3TrBalanceQueryKey,
  buildConvertB3trTx,
  getVot3BalanceQueryKey,
  getVotesQueryKey,
  buildB3trApprovesTx,
  getB3TrTokenDetailsQueryKey,
} from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback, useMemo } from "react"
import { getConfig } from "@repo/config"
import { removingExcessDecimals } from "@/utils/MathUtils"
import { useWallet, useConnex } from "@vechain/vechain-kit"

const config = getConfig()

// const buffer = 1.01
// Derived from mainnet onchain txs https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1723109024015819?thread_ts=1723106964.183119&cid=C06BLEJE5SA
// const suggestedMaxGas = 260118 * buffer

type useMintB3trProps = {
  amount?: string | number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to convert B3tr to Vot3
 * This hook will convert the tokens and wait for the txConfirmation
 * @param amount the amount of tokens to convert. Should not already include decimals
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useConvertB3tr = ({
  amount,
  onSuccess,
  invalidateCache = true,
}: useMintB3trProps): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])

  const buildClauses = useCallback(() => {
    if (!contractAmount) throw new Error("amount is required")
    const approveClause = buildB3trApprovesTx(thor, contractAmount, config.vot3ContractAddress)
    const convertB3trClause = buildConvertB3trTx(thor, contractAmount)
    return [approveClause, convertB3trClause]
  }, [thor, contractAmount])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      //b3tr user balance
      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(account?.address ?? undefined),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account?.address ?? undefined),
      })

      // vot3 balance
      await queryClient.cancelQueries({
        queryKey: getVot3BalanceQueryKey(account?.address ?? ""),
      })

      await queryClient.refetchQueries({
        queryKey: getVot3BalanceQueryKey(account?.address ?? ""),
      })

      //user votes
      await queryClient.cancelQueries({
        queryKey: getVotesQueryKey(account?.address ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getVotesQueryKey(account?.address ?? undefined),
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
  }, [invalidateCache, queryClient, onSuccess, account?.address])

  const result = useSendTransaction({
    signerAccount: account?.address,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
    // suggestedMaxGas,
  })

  return result
}
