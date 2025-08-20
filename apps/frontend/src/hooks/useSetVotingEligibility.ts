import { getAppsEligibleInNextRoundQueryKey } from "@/api"
import { useCallback, useMemo } from "react"
import { EnhancedClause, UseSendTransactionReturnValue } from "@vechain/vechain-kit"
import { X2EarnApps__factory } from "@vechain-kit/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = {
  appId: string
  isEligible: boolean
  appName?: string
  onSuccess?: () => void
}
/**
 * Admin can change the eligibility of an app in the next round
 *
 * @param onSuccess callback to run when the upgrade is successful
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useSetVotingEligibility = ({
  appId,
  isEligible,
  appName,
  onSuccess,
}: Props): UseSendTransactionReturnValue => {
  const clauseBuilder = useCallback(() => {
    const clauses: EnhancedClause[] = [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "setVotingEligibility",
        args: [appId, isEligible],
        comment: `Set voting eligibility for app ${appName} (id: ${appId}) to ${isEligible}`,
      }),
    ]

    return clauses
  }, [appId, isEligible, appName])

  const refetchQueryKeys = useMemo(() => [getAppsEligibleInNextRoundQueryKey()], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
