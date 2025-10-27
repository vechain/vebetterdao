import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getAppEndorsedEventsQueryKey } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { buildClause } from "@/utils/buildClause"

import { getIsBlacklistedQueryKey } from "../api/contracts/vePassport/hooks/useIsBlacklisted"
import { getAppEndorsementScoreQueryKey } from "../api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { getEndorsersQueryKey } from "../api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { getIsAppUnendorsedQueryKey } from "../api/contracts/xApps/hooks/endorsement/useIsAppUnendorsed"
import { getNodesEndorsedAppsQueryKey } from "../api/contracts/xApps/hooks/endorsement/useUserNodesEndorsement"
import { getAppExistsQueryKey } from "../api/contracts/xApps/hooks/useAppExists"
import { getXAppsQueryKey } from "../api/contracts/xApps/hooks/useXApps"
import { getUserNodesQueryKey } from "../api/contracts/xNodes/useGetUserNodes"

import { useBuildTransaction } from "./useBuildTransaction"

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
  const { account } = useWallet()
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "removeNodeEndorsement",
        args: [appId, nodeId],
        comment: `Remove node ${nodeId} endorsement from app ${appId}`,
      }),
    ]
  }, [appId, nodeId])
  const refetchQueryKeys = useMemo(
    () => [
      getIsAppUnendorsedQueryKey(appId ?? ""),
      getAppEndorsementScoreQueryKey(appId ?? ""),
      getNodesEndorsedAppsQueryKey(nodeId ? [nodeId] : []),
      getEndorsersQueryKey(appId ?? ""),
      getXAppsQueryKey(),
      getIsBlacklistedQueryKey(appId ?? ""),
      getAppExistsQueryKey(appId ?? ""),
      getAppEndorsedEventsQueryKey({ appId }),
      getUserNodesQueryKey(account?.address ?? ""),
    ],
    [appId, nodeId, account?.address],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
