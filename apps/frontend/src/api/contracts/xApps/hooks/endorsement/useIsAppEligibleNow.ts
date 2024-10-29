import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "isEligibleNow"

/**
 * Get the query key for a boolean value indicating if the app is eligible
 * @param appId  the query key
 */
export const getIsAppEligibleNowQueryKey = (appId: string) => getCallKey({ method, keyArgs: [appId] })

/**
 *  Hook to get a boolean value indicating if the app is eligible
 * @param appId  the app id
 * @returns a boolean value indicating if the app is eligible
 */
export const useIsAppEligibleNow = (appId: string): UseQueryResult<boolean, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [appId],
  })
}
