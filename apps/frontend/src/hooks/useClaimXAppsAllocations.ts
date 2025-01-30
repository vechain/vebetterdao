import { buildClaimXAppAllocationTx, getB3TrBalanceQueryKey, getHasXAppClaimedQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"

import { useCallback } from "react"
import { useSendTransaction, UseSendTransactionReturnValue, useWallet } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"

type useClaimAllocationsProps = {
  roundId: string
  appIds: string[]
  onSuccess?: () => void
  onFailure?: () => void
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
  onFailure,
  invalidateCache = true,
}: useClaimAllocationsProps): useBClaimXAppsAllocationsReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()
  const config = getConfig()

  const buildClauses = useCallback((roundId: string, appIds: string[]) => {
    const clauses = buildClaimXAppAllocationTx(roundId, appIds)
    return clauses
  }, [])

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
        queryKey: getB3TrBalanceQueryKey(account?.address ?? ""),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account?.address ?? ""),
      })

      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(config.x2EarnRewardsPoolContractAddress),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(config.x2EarnRewardsPoolContractAddress),
      })
    }

    onSuccess?.()
  }, [account?.address, invalidateCache, onSuccess, queryClient, appIds, roundId, config])

  const result = useSendTransaction({
    signerAccount: account?.address,
    onTxConfirmed: handleOnSuccess,
    onTxFailedOrCancelled: onFailure,
  })

  const onMutate = useCallback(async () => {
    const clauses = buildClauses(roundId, appIds)
    return result.sendTransaction(clauses)
  }, [buildClauses, result, roundId, appIds])

  return { ...result, sendTransaction: onMutate }
}
