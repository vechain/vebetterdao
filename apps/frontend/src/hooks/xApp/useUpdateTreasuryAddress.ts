import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { getXAppsQueryKey } from "@/api/contracts/xApps/hooks/useXApps"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Params = { address: string }

export const useUpdateTreasuryAddress = (appId: string) => {
  const clauseBuilder = useCallback(
    (params: Params) => [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "updateTeamWalletAddress",
        args: [appId, params.address],
        comment: "Update treasury address",
      }),
    ],
    [appId],
  )

  const refetchQueryKeys = useMemo(() => [getXAppsQueryKey()], [])

  return useBuildTransaction<Params>({
    clauseBuilder,
    refetchQueryKeys,
  })
}
