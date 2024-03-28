import { getXAppsQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { XAllocationVoting__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

type useUpdateAppDetailsProps = {
  appId: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

type BuildClausesProps = {
  metadataUri: string
  receiverAddress?: string
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
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(
    ({ metadataUri, receiverAddress }: BuildClausesProps) => {
      const clauses: EnhancedClause[] = [
        {
          to: getConfig().xAllocationVotingContractAddress,
          value: 0,
          data: XAllocationVotingInterface.encodeFunctionData("updateAppMetadata", [appId, metadataUri]),
          comment: "Update app metadata",
          abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("updateAppMetadata"))),
        },
        ...(receiverAddress
          ? [
              {
                to: getConfig().xAllocationVotingContractAddress,
                value: 0,
                data: XAllocationVotingInterface.encodeFunctionData("updateAppReceiverAddress", [
                  appId,
                  receiverAddress,
                ]),
                comment: "Update app receiver address",
                abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("updateAppReceiverAddress"))),
              },
            ]
          : []),
      ]

      return clauses
    },
    [thor, appId],
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
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, appId])

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
