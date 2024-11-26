import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().nodeManagementContractAddress
const contractInterface = NodeManagement__factory.createInterface()
const method = "getUserNode"

export type UserNode = {
  nodeId: string
  nodeLevel: number
  xNodeOwner: string
  isXNodeHolder: boolean
  isXNodeDelegated: boolean
  isXNodeDelegator: boolean
  isXNodeDelegatee: boolean
  delegatee: string
}

/**
 * Get the query key for fetching user node
 * @param user - The address of the user to check
 */
export const getUserNodeQueryKey = (user?: string) => getCallKey({ method, keyArgs: [user] })

/**
 * Hook to get delegation details for a specific node
 * @param user - The address of the user to check
 * @returns An object containing user node details: nodeId, nodeLevel, xNodeOwner, isXNodeHolder, isXNodeDelegated, isXNodeDelegator, and delegatee address
 */
export const useGetUserNode = (user?: string): UseQueryResult<UserNode, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [user],
    mapResponse: response => ({
      nodeId: response.decoded[0],
      nodeLevel: response.decoded[1],
      xNodeOwner: response.decoded[2],
      isXNodeHolder: response.decoded[3],
      isXNodeDelegated: response.decoded[4],
      isXNodeDelegator: response.decoded[5],
      delegatee: response.decoded[6],
    }),
    enabled: !!user,
  })
}
