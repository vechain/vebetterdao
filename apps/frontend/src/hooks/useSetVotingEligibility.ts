import { getAppsEligibleInNextRoundQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = {
  appId: string
  isEligible: boolean
  appName?: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Admin can change the eligibility of an app in the next round
 *
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useSetVotingEligibility = ({
  appId,
  isEligible,
  appName,
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
        data: X2EarnAppsInterface.encodeFunctionData("setVotingEligibility", [appId, isEligible]),
        comment: `Set voting eligibility for app ${appName} (id: ${appId}) to ${isEligible}`,
        abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("setVotingEligibility"))),
      },
    ]

    return clauses
  }, [appId, isEligible, appName])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getAppsEligibleInNextRoundQueryKey(),
      })

      await queryClient.refetchQueries({
        queryKey: getAppsEligibleInNextRoundQueryKey(),
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
