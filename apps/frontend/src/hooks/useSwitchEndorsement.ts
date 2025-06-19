import { useCallback, useMemo } from "react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import {
  getAppEndorsementScoreQueryKey,
  getEndorsersQueryKey,
  getIsAppUnendorsedQueryKey,
  getXNodeCheckCooldownQueryKey,
  getNodesEndorsedAppsQueryKey,
} from "@/api"
import { getXAppsQueryKey } from "@vechain/vechain-kit"
import { buildClause } from "@/utils/buildClause"
import { getAppEndorsedEventsQueryKey } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = { appIdToEndorse: string; appIdToUnendorse: string; nodeId: string; onSuccess?: () => void }

/**
 * Hook to switch endorsement of an app
 * @param appIdToEndorse - The ID of the app to endorse.
 * @param appIdToUnendorse - The ID of the app to unendorse.
 * @param nodeId - The ID of the node performing the endorsement/unendorsement.
 * @param onSuccess - Optional callback to execute after the transaction is successful.
 * @returns The result of the useBuildTransaction hook.
 *
 **/
export const useSwitchEndorsement = ({ appIdToEndorse, appIdToUnendorse, nodeId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "unendorseApp",
        args: [appIdToUnendorse, nodeId],
        comment: `Unendorse app ${appIdToUnendorse} with node ${nodeId}`,
      }),
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "endorseApp",
        args: [appIdToEndorse, nodeId],
        comment: `Endorse app ${appIdToEndorse} with node ${nodeId}`,
      }),
    ]
  }, [appIdToEndorse, appIdToUnendorse, nodeId])

  const refetchQueryKeys = useMemo(
    () => [
      // Refetch queries for the app being endorsed
      getIsAppUnendorsedQueryKey(appIdToEndorse),
      getAppEndorsementScoreQueryKey(appIdToEndorse),
      getEndorsersQueryKey(appIdToEndorse),
      getAppEndorsedEventsQueryKey({ appId: appIdToEndorse }),
      // Refetch queries for the app being unendorsed
      getIsAppUnendorsedQueryKey(appIdToUnendorse),
      getAppEndorsementScoreQueryKey(appIdToUnendorse),
      getEndorsersQueryKey(appIdToUnendorse),
      // Other queries
      getNodesEndorsedAppsQueryKey(nodeId ? [nodeId] : []),
      getXAppsQueryKey(),
      getXNodeCheckCooldownQueryKey(nodeId),
    ],
    [appIdToEndorse, appIdToUnendorse, nodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
