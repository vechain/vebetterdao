import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { getAppEndorsedEventsQueryKey } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { buildClause } from "@/utils/buildClause"

import { getIsBlacklistedQueryKey } from "../../api/contracts/vePassport/hooks/useIsBlacklisted"
import { getAppEndorsementScoreQueryKey } from "../../api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { getEndorsersQueryKey } from "../../api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { getIsAppUnendorsedQueryKey } from "../../api/contracts/xApps/hooks/endorsement/useIsAppUnendorsed"
import { getNodesEndorsedAppsQueryKey } from "../../api/contracts/xApps/hooks/endorsement/useUserNodesEndorsement"
import { getAppExistsQueryKey } from "../../api/contracts/xApps/hooks/useAppExists"
import { getXAppsQueryKey } from "../../api/contracts/xApps/hooks/useXApps"
import { getUserNodesQueryKey } from "../../api/contracts/xNodes/useGetUserNodes"
import { TransactionCustomUI } from "../../providers/TransactionModalProvider"
import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type Props = {
  appId: string
  nodeId: string
  points: string
  userAddress: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}
/**
 * Hook to endorse an app
 * @param appId  the app id to endorse
 * @param nodeId  the node id to endorse with
 * @param userAddress  the user address
 * @param onSuccess  the callback to call after the app is endorsed
 * @returns the endorse transaction
 */
export const useEndorseApp = ({ appId, nodeId, points, userAddress, onSuccess, transactionModalCustomUI }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "endorseApp",
        args: [appId, nodeId, points],
        comment: `Endorse app ${appId} with node ${nodeId} (${points} points)`,
      }),
    ]
  }, [appId, nodeId, points])
  const refetchQueryKeys = useMemo(
    () => [
      getUserNodesQueryKey(userAddress),
      getIsAppUnendorsedQueryKey(appId),
      getAppEndorsementScoreQueryKey(appId),
      getNodesEndorsedAppsQueryKey(nodeId ? [nodeId] : []),
      getEndorsersQueryKey(appId),
      getXAppsQueryKey(),
      getIsBlacklistedQueryKey(appId),
      getAppExistsQueryKey(appId),
      getAppEndorsedEventsQueryKey({ appId }),
    ],
    [appId, nodeId, userAddress],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
