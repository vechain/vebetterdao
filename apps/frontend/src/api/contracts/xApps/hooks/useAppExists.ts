import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "appExists"

/**
 * Get the query key for a boolean value indicating if the app exists
 * @param appId the app id
 */
export const getAppExistsQueryKey = (appId: string) => getCallKey({ method, keyArgs: [appId] })

/**
 * Hook to get a boolean value indicating if the app exists
 * @param appId the app id
 * @returns a boolean value, true for apps that have been included in at least one allocation round
 */
export const useAppExists = (appId: string): UseQueryResult<boolean, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [appId],
  })
}
