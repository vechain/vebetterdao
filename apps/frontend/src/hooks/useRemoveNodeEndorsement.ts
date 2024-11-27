import { useCallback, useMemo } from "react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import {
  getAppEndorsementScoreQueryKey,
  getAppExistsQueryKey,
  getAppIsBlacklistedQueryKey,
  getEndorsersQueryKey,
  getIsAppEligibleNowQueryKey,
  getIsAppUnendorsedQueryKey,
  getNodesEndorsedAppsQueryKey,
  getXAppsQueryKey,
} from "@/api"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type Props = { appId?: string; nodeId?: string; onSuccess?: () => void }

/**
 * Hook for app owners to remove an endorsement
 * @param appId  the app id
 * @param nodeId  the node id
 * @param onSuccess  the callback to call after the endorsement is removed
 * @returns the remove endorsement transaction
 */
export const useRemoveNodeEndorsement = ({ appId, nodeId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "removeNodeEndorsement",
        args: [appId, nodeId],
        comment: `Remove endorsement from ${nodeId} for app ${appId}`,
      }),
    ]
  }, [appId, nodeId])

  const refetchQueryKeys = useMemo(
    () => [
      getIsAppEligibleNowQueryKey(appId ?? ""),
      getIsAppUnendorsedQueryKey(appId ?? ""),
      getAppEndorsementScoreQueryKey(appId),
      getNodesEndorsedAppsQueryKey(nodeId ? [nodeId] : []),
      getEndorsersQueryKey(appId ?? ""),
      getXAppsQueryKey(),
      getAppIsBlacklistedQueryKey(appId ?? ""),
      getAppExistsQueryKey(appId ?? ""),
    ],
    [appId, nodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
