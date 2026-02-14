import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { getAppCreatorsQueryKey } from "@/api/contracts/xApps/hooks/useAppCreators"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Params = { action: "add"; address: string } | { action: "remove"; address: string }

export const useManageCreators = (appId: string) => {
  const clauseBuilder = useCallback(
    (params: Params) => {
      if (params.action === "add") {
        return [
          buildClause({
            to: getConfig().x2EarnAppsContractAddress,
            contractInterface: X2EarnAppsInterface,
            method: "addCreator",
            args: [appId, params.address],
            comment: "Add creator",
          }),
        ]
      }
      return [
        buildClause({
          to: getConfig().x2EarnAppsContractAddress,
          contractInterface: X2EarnAppsInterface,
          method: "removeAppCreator",
          args: [appId, params.address],
          comment: "Remove creator",
        }),
      ]
    },
    [appId],
  )

  const refetchQueryKeys = useMemo(() => [getAppCreatorsQueryKey(appId)], [appId])

  return useBuildTransaction<Params>({
    clauseBuilder,
    refetchQueryKeys,
  })
}
