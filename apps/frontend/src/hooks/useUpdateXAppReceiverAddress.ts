import { getXAppsQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = {
  appId: string
  newAddress: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Admin can update the receiver address for a specific xApp
 *
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useUpdateXAppReceiverAddress = ({
  appId,
  newAddress,
  onSuccess,
  invalidateCache = true,
}: Props): UseSendTransactionReturnValue => {
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().x2EarnAppsContractAddress,
        value: 0,
        data: X2EarnAppsInterface.encodeFunctionData("updateAppReceiverAddress", [appId, newAddress]),
        comment: "Update xApp receiver address to " + newAddress,
        abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("updateAppReceiverAddress"))),
      },
    ]

    return clauses
  }, [appId, newAddress])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.refetchQueries({
        queryKey: getXAppsQueryKey(),
      })
    }

    toast({
      title: "XApp receiver address updated successfully",
      description: `A new address ${newAddress} has been set as receiver for the selected xApp.`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, newAddress])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
