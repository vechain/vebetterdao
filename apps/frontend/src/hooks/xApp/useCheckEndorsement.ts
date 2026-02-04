import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAppEndorsementScoreQueryKey } from "../../api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { getEndorsersQueryKey } from "../../api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { getIsAppUnendorsedQueryKey } from "../../api/contracts/xApps/hooks/endorsement/useIsAppUnendorsed"
import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type Props = { appId: string; onSuccess?: () => void }
/**
 * Hook to check endorsement of an app
 * @param appId  the app id to endorse
 * @param onSuccess  the callback to call after the check is done
 * @returns the check endorsement transaction
 */
export const useCheckEndorsement = ({ appId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "checkEndorsement",
        args: [appId],
        comment: `Check endorsement for ${appId}`,
      }),
    ]
  }, [appId])
  const refetchQueryKeys = useMemo(
    () => [getIsAppUnendorsedQueryKey(appId), getAppEndorsementScoreQueryKey(appId), getEndorsersQueryKey(appId)],
    [appId],
  )
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
