import { useCallback, useMemo } from "react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { getAppEndorsementScoreQueryKey, getNodesEndorsedAppsQueryKey } from "@/api"
import { buildClause } from "@/utils/buildClause"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type Props = { appId?: string; nodeId?: string; onSuccess?: () => void }

/**
 * Hook to unendorse an app
 * @param appId  the app id to unendorse
 * @param nodeId  the node id to unendorse with
 * @param onSuccess  the callback to call after the app is unendorsed
 * @returns the unendorse transaction
 */
export const useUnendorseApp = ({ appId, nodeId, onSuccess }: Props) => {
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
    () => [getAppEndorsementScoreQueryKey(appId), getNodesEndorsedAppsQueryKey(nodeId ? [nodeId] : [])],
    [appId, nodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
