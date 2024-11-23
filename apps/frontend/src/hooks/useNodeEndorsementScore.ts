import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "getNodeEndorsementScore"

/**
 * Get the query key for the endorsement score of a node ID.
 */
export const getEndorsersQueryKey = (nodeId: string) => {
  getCallKey({ method, keyArgs: [nodeId] })
}

/**
 * Hook that fetches the endorsement score of a node ID
 * @param nodeId the node Id of the endorser
 *
 * @returns the endorsement score
 */
export const useNodeEndorsementScore = (nodeId: string): UseQueryResult<string, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [nodeId],
  })
}
