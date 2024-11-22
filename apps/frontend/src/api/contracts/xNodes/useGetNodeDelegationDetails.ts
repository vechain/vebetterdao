import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().nodeManagementContractAddress
const contractInterface = NodeManagement__factory.createInterface()
const method = "getNodeDelegationDetails"

type NodeDelegationDetails = {
  isDelegated: boolean
  delegatee: string
  owner: string
}

/**
 * Get the query key for fetching node delegation details
 * @param nodeId - The ID of the node to check
 */
export const getNodeDelegationDetailsQueryKey = (nodeId?: string) => getCallKey({ method, keyArgs: [nodeId] })

/**
 * Hook to get delegation details for a specific node
 * @param nodeId - The ID of the node to check
 * @returns An object containing delegation details: isDelegated, delegatee address, and owner address
 */
export const useGetNodeDelegationDetails = (nodeId?: string): UseQueryResult<NodeDelegationDetails, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [nodeId],
    mapResponse: response => ({
      isDelegated: response.decoded[0],
      delegatee: response.decoded[1],
      owner: response.decoded[2],
    }),
    enabled: !!nodeId,
  })
}
