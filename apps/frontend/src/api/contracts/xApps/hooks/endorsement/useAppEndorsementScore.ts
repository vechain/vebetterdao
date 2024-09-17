import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "getScore"

/**
 * Get the query key the app endorsement score
 */
export const getAppEndorsementScore = (appId: string) => getCallKey({ method, keyArgs: [appId] })

/**
 *  Hook to get the endorsement score threshold
 * @returns The endorsement score threshold
 */
export const useAppEndorsementScore = (appId?: string): UseQueryResult<string, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [appId],
    enabled: !!appId,
  })
}
