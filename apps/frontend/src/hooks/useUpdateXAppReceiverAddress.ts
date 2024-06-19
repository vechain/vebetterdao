import { getXAppsQueryKey } from "@/api"
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
 * Admin can update the team wallet address for a specific xApp
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
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().x2EarnAppsContractAddress,
        value: 0,
        data: X2EarnAppsInterface.encodeFunctionData("updateTeamWalletAddress", [appId, newAddress]),
        comment: "Update xApp team wallet address to " + newAddress,
        abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("updateTeamWalletAddress"))),
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
    onSuccess?.()
  }, [invalidateCache, queryClient, onSuccess])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
