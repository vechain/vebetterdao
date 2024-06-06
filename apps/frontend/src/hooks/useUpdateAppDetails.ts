import { getXAppMetadataQueryKey, getXAppsQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type useUpdateAppDetailsProps = {
  appId: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

type BuildClausesProps = {
  metadataUri: string
  teamWalletAddress?: string
}
type useUpdateAppMetadataReturnValue = {
  sendTransaction: (data: BuildClausesProps) => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 *  Hook to update the metadata of an app
 * @param param0 appId, onSuccess, invalidateCache
 * @returns see {@link useUpdateAppMetadataReturnValue}
 */
export const useUpdateAppDetails = ({
  appId,
  onSuccess,
  invalidateCache = true,
}: useUpdateAppDetailsProps): useUpdateAppMetadataReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(
    ({ metadataUri, teamWalletAddress }: BuildClausesProps) => {
      const clauses: EnhancedClause[] = [
        {
          to: getConfig().x2EarnAppsContractAddress,
          value: 0,
          data: X2EarnAppsInterface.encodeFunctionData("updateAppMetadata", [appId, metadataUri]),
          comment: "Update app metadata",
          abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("updateAppMetadata"))),
        },
        ...(teamWalletAddress
          ? [
              {
                to: getConfig().x2EarnAppsContractAddress,
                value: 0,
                data: X2EarnAppsInterface.encodeFunctionData("updateTeamWalletAddress", [appId, teamWalletAddress]),
                comment: "Update team wallet address",
                abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("updateTeamWalletAddress"))),
              },
            ]
          : []),
      ]

      return clauses
    },
    [appId],
  )

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getXAppsQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: getXAppsQueryKey(),
      })
      await queryClient.cancelQueries({
        queryKey: getXAppMetadataQueryKey(appId),
      })
      await queryClient.refetchQueries({
        queryKey: getXAppMetadataQueryKey(appId),
      })
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, onSuccess, appId])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  /**
   * Send a transaction with the given clauses (in case you need to pass data to build the clauses to mutate directly)
   * @param vote the vote to cast
   * @param reason the reason for the vote
   * @returns see x@xxxx UseSendTransactionReturnValue}
   */
  const onMutate = useCallback(
    async (data: BuildClausesProps) => {
      const clauses = buildClauses(data)
      return result.sendTransaction(clauses)
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction: onMutate }
}
