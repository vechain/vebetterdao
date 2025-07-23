import { useCallback, useMemo } from "react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import {
  getAppEndorsementScoreQueryKey,
  getAppExistsQueryKey,
  getIsBlacklistedQueryKey,
  getEndorsersQueryKey,
  getIsAppUnendorsedQueryKey,
  getNodesEndorsedAppsQueryKey,
  getUserNodesQueryKey,
  getXAppsQueryKey,
} from "@/api"
import { buildClause } from "@/utils/buildClause"
import { getAppEndorsedEventsQueryKey } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = { appId?: string; nodeId?: string; userAddress?: string; onSuccess?: () => void }

/**
 * Hook for node holders to unendorse an app
 * @param appId  the app id to unendorse
 * @param nodeId  the node id to unendorse with
 * @param userAddress  the address of the node holder (aka endorser)
 * @param onSuccess  the callback to call after the app is unendorsed
 * @returns the unendorse transaction
 */
export const useUnendorseApp = ({ appId, nodeId, userAddress, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "unendorseApp",
        args: [appId, nodeId],
        comment: `Unendorse app ${appId} with node ${nodeId}`,
      }),
    ]
  }, [appId, nodeId])

  const refetchQueryKeys = useMemo(
    () => [
      getUserNodesQueryKey(userAddress ?? ""),
      getIsAppUnendorsedQueryKey(appId ?? ""),
      getAppEndorsementScoreQueryKey(appId ?? ""),
      getNodesEndorsedAppsQueryKey(nodeId ? [nodeId] : []),
      getEndorsersQueryKey(appId ?? ""),
      getXAppsQueryKey(),
      getIsBlacklistedQueryKey(appId ?? ""),
      getAppExistsQueryKey(appId ?? ""),
      getAppEndorsedEventsQueryKey({ appId }),
      getAppEndorsedEventsQueryKey({ appId, nodeId }),
    ],
    [appId, nodeId, userAddress],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
