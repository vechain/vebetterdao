import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "gracePeriod"

/**
 * Get the query key for endorsement grace period
 */
export const getEndorsementGracePeriodQueryKey = () => {
  getCallKey({ method, keyArgs: [] })
}

/**
 *  Hook to get the endorsement grace period
 * @returns The endorsement grace period
 */
export const useEndorsementGracePeriod = (): UseQueryResult<string, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [],
  })
}
