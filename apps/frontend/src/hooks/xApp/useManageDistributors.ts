import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { getAppRewardDistributorsQueryKey } from "@/api/contracts/xApps/hooks/useAppRewardDistributors"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Params = { action: "add"; address: string } | { action: "remove"; address: string }

export const useManageDistributors = (appId: string) => {
  const clauseBuilder = useCallback(
    (params: Params) => {
      if (params.action === "add") {
        return [
          buildClause({
            to: getConfig().x2EarnAppsContractAddress,
            contractInterface: X2EarnAppsInterface,
            method: "addRewardDistributor",
            args: [appId, params.address],
            comment: "Add reward distributor",
          }),
        ]
      }
      return [
        buildClause({
          to: getConfig().x2EarnAppsContractAddress,
          contractInterface: X2EarnAppsInterface,
          method: "removeRewardDistributor",
          args: [appId, params.address],
          comment: "Remove reward distributor",
        }),
      ]
    },
    [appId],
  )

  const refetchQueryKeys = useMemo(() => [getAppRewardDistributorsQueryKey(appId)], [appId])

  return useBuildTransaction<Params>({
    clauseBuilder,
    refetchQueryKeys,
  })
}
