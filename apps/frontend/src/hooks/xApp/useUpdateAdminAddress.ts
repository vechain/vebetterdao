import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { getAppAdminQueryKey } from "@/api/contracts/xApps/hooks/useAppAdmin"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Params = { address: string }

export const useUpdateAdminAddress = (appId: string) => {
  const clauseBuilder = useCallback(
    (params: Params) => [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "setAppAdmin",
        args: [appId, params.address],
        comment: "Update admin address",
      }),
    ],
    [appId],
  )

  const refetchQueryKeys = useMemo(() => [getAppAdminQueryKey(appId)], [appId])

  return useBuildTransaction<Params>({
    clauseBuilder,
    refetchQueryKeys,
  })
}
