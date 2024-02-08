import { getB3TrTokenDetailsQueryKey, getB3TrBalanceQueryKey, buildProposeAllocationRoundTx } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"

type useProposeAllocationRoundProps = {
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to propose a new allocation round to distribute B3TR tokens
 * This hook will send a propose allocation round transaction to the blockchain and wait for the txConfirmation
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useProposeAllocationRound = ({
  onSuccess,
  invalidateCache = true,
}: useProposeAllocationRoundProps): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const clauses = buildProposeAllocationRoundTx(thor)
    return [clauses]
  }, [thor])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getB3TrTokenDetailsQueryKey(),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrTokenDetailsQueryKey(),
      })
      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })
    }

    toast({
      title: "Allocation Round Proposed",
      description: `The allocation round has been proposed successfully!`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
