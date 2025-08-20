import { useCallback, useMemo } from "react"
import { X2EarnApps__factory } from "@vechain-kit/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import {
  getAppEndorsementScoreQueryKey,
  getAppExistsQueryKey,
  getIsBlacklistedQueryKey,
  getEndorsersQueryKey,
  getIsAppUnendorsedQueryKey,
  getNodesEndorsedAppsQueryKey,
  getXAppsQueryKey,
  getUserNodesQueryKey,
} from "@/api"
import { getAppEndorsedEventsQueryKey } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useWallet } from "@vechain/vechain-kit"

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
