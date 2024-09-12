import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "appExists"

/**
 * Get the query key for checking if the app exists and if it has been included in at least one allocation round.
 */
export const getCheckAppExistenceQueryKey = (appId: string) => {
  getCallKey({ method, keyArgs: [appId] })
}

/**
 *  Hook to get if the app exists and if it has been included in at least one allocation round.
 * @returns A boolean indicating if the app exists and if it has been included in at least one allocation round.
 */
export const useCheckAppExistence = (appId: string): UseQueryResult<boolean, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [appId],
  })
}
