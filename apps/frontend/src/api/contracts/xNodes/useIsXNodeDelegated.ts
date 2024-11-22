import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().nodeManagementContractAddress
const contractInterface = NodeManagement__factory.createInterface()
const method = "isNodeDelegated"

/**
 * Get the query key for checking if a node is delegated
 * @param nodeId - The ID of the node to check
 */
export const getIsXNodeDelegatedQueryKey = (nodeId?: string) => getCallKey({ method, keyArgs: [nodeId] })

/**
 * Hook to check if a specific xnode is delegated
 * @param nodeId - The ID of the node to check
 * @returns A boolean indicating if the node is delegated
 */
export const useIsXNodeDelegated = (nodeId?: string): UseQueryResult<boolean, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [nodeId],
    enabled: !!nodeId,
  })
}
