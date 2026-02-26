import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { getAppIsBlackListedQueryKey } from "@/api/contracts/xApps/hooks/useAppIsBlackListed"
import { getXAppsQueryKey } from "@/api/contracts/xApps/hooks/useXApps"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

export const useSelfBlacklistApp = (appId: string, onSuccess?: () => void) => {
  const clauseBuilder = useCallback(
    () => [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "selfBlacklistApp",
        args: [appId],
        comment: "Self-blacklist app",
      }),
    ],
    [appId],
  )

  const refetchQueryKeys = useMemo(() => [getAppIsBlackListedQueryKey(appId), getXAppsQueryKey()], [appId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
