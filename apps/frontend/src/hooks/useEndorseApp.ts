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
  getNodeCheckCooldownQueryKey,
  getNodesEndorsedAppsQueryKey,
  getUserXNodesQueryKey,
} from "@/api"
import { getXAppsQueryKey } from "@vechain/vechain-kit"
import { buildClause } from "@/utils/buildClause"
import { getAppEndorsedEventsQueryKey } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = { appId: string; nodeId: string; userAddress: string; onSuccess?: () => void }

/**
 * Hook to endorse an app
 * @param appId  the app id to endorse
 * @param nodeId  the node id to endorse with
 * @param userAddress  the user address
 * @param onSuccess  the callback to call after the app is endorsed
 * @returns the endorse transaction
 */
export const useEndorseApp = ({ appId, nodeId, userAddress, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "endorseApp",
        args: [appId, nodeId],
        comment: `Endorse app ${appId} with node ${nodeId}`,
      }),
    ]
  }, [appId, nodeId])

  const refetchQueryKeys = useMemo(
    () => [
      getUserXNodesQueryKey(userAddress),
      getIsAppUnendorsedQueryKey(appId),
      getAppEndorsementScoreQueryKey(appId),
      getNodesEndorsedAppsQueryKey(nodeId ? [nodeId] : []),
      getEndorsersQueryKey(appId),
      getXAppsQueryKey(),
      getIsBlacklistedQueryKey(appId),
      getAppExistsQueryKey(appId),
      getAppEndorsedEventsQueryKey({ appId }),
      getNodeCheckCooldownQueryKey(nodeId),
    ],
    [appId, nodeId, userAddress],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
