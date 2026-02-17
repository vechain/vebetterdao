import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"
import { getEventsKey } from "../useEvents"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

type Params = { action: "add"; address: string } | { action: "remove"; address: string }

export const useManageSignalers = (appId: string) => {
  const clauseBuilder = useCallback(
    (params: Params) => {
      if (params.action === "add") {
        return [
          buildClause({
            to: getConfig().veBetterPassportContractAddress,
            contractInterface: VeBetterPassportInterface,
            method: "assignSignalerToAppByAppAdmin",
            args: [appId, params.address],
            comment: "Add signaler",
          }),
        ]
      }
      return [
        buildClause({
          to: getConfig().veBetterPassportContractAddress,
          contractInterface: VeBetterPassportInterface,
          method: "removeSignalerFromAppByAppAdmin",
          args: [params.address],
          comment: "Remove signaler",
        }),
      ]
    },
    [appId],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getEventsKey({ eventName: "SignalerAssignedToApp", filterParams: { app: appId } }),
      getEventsKey({ eventName: "SignalerRemovedFromApp", filterParams: { app: appId } }),
    ],
    [appId],
  )

  return useBuildTransaction<Params>({
    clauseBuilder,
    refetchQueryKeys,
  })
}
