import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { EnhancedClause } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAppsEligibleInNextRoundQueryKey } from "../api/contracts/xApps/hooks/useAppsEligibleInNextRound"

import { useBuildTransaction } from "./useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type BuildClausesProps = {
  appId: string
  desiredEligibility: boolean
  appName?: string
}
/**
 * Admin can change the eligibility of an app in the next round
 *
 */
export const useSetVotingEligibility = () => {
  const buildClauses = useCallback(({ appId, desiredEligibility, appName }: BuildClausesProps) => {
    const clauses: EnhancedClause[] = [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "setVotingEligibility",
        args: [appId, desiredEligibility],
        comment: `Set voting eligibility for app ${appName} (id: ${appId}) to ${desiredEligibility}`,
      }),
    ]
    return clauses
  }, [])
  const refetchQueryKeys = useMemo(() => [getAppsEligibleInNextRoundQueryKey()], [])
  return useBuildTransaction({
    clauseBuilder: buildClauses,
    refetchQueryKeys,
  })
}
