import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { getAppModeratorsQueryKey } from "@/api/contracts/xApps/hooks/useAppModerators"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Params = { action: "add"; address: string } | { action: "remove"; address: string }

export const useManageModerators = (appId: string) => {
  const clauseBuilder = useCallback(
    (params: Params) => {
      if (params.action === "add") {
        return [
          buildClause({
            to: getConfig().x2EarnAppsContractAddress,
            contractInterface: X2EarnAppsInterface,
            method: "addAppModerator",
            args: [appId, params.address],
            comment: "Add moderator",
          }),
        ]
      }
      return [
        buildClause({
          to: getConfig().x2EarnAppsContractAddress,
          contractInterface: X2EarnAppsInterface,
          method: "removeAppModerator",
          args: [appId, params.address],
          comment: "Remove moderator",
        }),
      ]
    },
    [appId],
  )

  const refetchQueryKeys = useMemo(() => [getAppModeratorsQueryKey(appId)], [appId])

  return useBuildTransaction<Params>({
    clauseBuilder,
    refetchQueryKeys,
  })
}
