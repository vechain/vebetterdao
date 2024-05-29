import { buildClaimXAppAllocationTx, getB3TrBalanceQueryKey, getHasXAppClaimedQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"

type useClaimAllocationsProps = {
  roundId: string
  appIds: string[]
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

type useBClaimXAppsAllocationsReturnValue = {
  sendTransaction: () => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * Claim allocation rewards for a specific round for multiple xApps
 *
 * @param roundId Id of the round to claim the allocations
 * @param appIds Ids of the xApps to claim the allocations
 * @returns {ClaimAllocationsReturnValue}
 */
export const useClaimXAppsAllocations = ({
  roundId,
  appIds,
  onSuccess,
  invalidateCache = true,
}: useClaimAllocationsProps): useBClaimXAppsAllocationsReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(
    (roundId: string, appIds: string[]) => {
      const clauses = buildClaimXAppAllocationTx(thor, roundId, appIds)
      return clauses
    },
    [thor],
  )

  // Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      for (const appId of appIds) {
        await queryClient.cancelQueries({
          queryKey: getHasXAppClaimedQueryKey(roundId, appId),
        })
        await queryClient.refetchQueries({
          queryKey: getHasXAppClaimedQueryKey(roundId, appId),
        })
      }

      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? ""),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? ""),
      })
    }

    toast({
      title: "Allocations claimed",
      description: `You have successfully claimed allocation for the xApps of round #${roundId}.`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [account, invalidateCache, onSuccess, queryClient, appIds, roundId, toast])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  const onMutate = useCallback(async () => {
    const clauses = buildClauses(roundId, appIds)
    return result.sendTransaction(clauses)
  }, [buildClauses, result, roundId, appIds])

  return { ...result, sendTransaction: onMutate }
}
