import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "getEndorsers"

/**
 * Get the query key for the list of endorsers for an app
 */
export const getEndorsersQueryKey = (appId: string) => {
  getCallKey({ method, keyArgs: [appId] })
}

/**
 *  Hook to get the list of endorsers for an app
 * @returns The endorsers for an app
 */
export const useAppEndorsers = (appId?: string): UseQueryResult<string[], Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [appId],
    enabled: !!appId,
  })
}
