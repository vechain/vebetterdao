import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "getUsersEndorsementScore"

/**
 * Get the query key the user endorsement score
 */
export const getUserEndorsementScore = (user?: string | null) => {
  getCallKey({ method, keyArgs: [user] })
}

/**
 *  Hook to get the endorsement score of the user
 * @returns The endorsement score of the user
 */
export const useUserEndorsementScore = (user?: string | null): UseQueryResult<string, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method: "getUsersEndorsementScore",
    args: [user],
    enabled: !!user,
  })
}
