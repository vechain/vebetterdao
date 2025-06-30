import { getCallKey, useCall, useMultipleCalls, UseCallParams } from "@/hooks"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"

const contractAddress = getConfig().nodeManagementContractAddress
const contractInterface = NodeManagement__factory.createInterface()
const method = "getUserNodes"

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
type UserNodeWithIsLegacy = UserNode & {
  isLegacyNode: boolean
}

/**
 * Get the query key for fetching user nodes
 * @param user - The address of the user to check
 */
export const getUserNodesQueryKey = (user?: string) => getCallKey({ method, keyArgs: [user] })

/**
 * Hook to get delegation details for all nodes associated with a user
 * @param user - The address of the user to check
 * @returns An array of objects containing user node details
 */
export const useGetUserNodes = (user?: string): UseQueryResult<UserNodeWithIsLegacy[], Error> => {
  // First get the token ID owned by the address (legacy contract only supports one token per address)
  const userNodes = useCall({
    contractInterface,
    contractAddress,
    method,
    args: [user],
    enabled: !!user,
    mapResponse: response => {
      // Response will be an array of node structs
      return response.decoded[0].map((node: any) => ({
        nodeId: node.nodeId.toString(),
        nodeLevel: Number(node.nodeLevel),
        xNodeOwner: node.xNodeOwner,
        isXNodeHolder: node.isXNodeHolder,
        isXNodeDelegated: node.isXNodeDelegated,
        isXNodeDelegator: node.isXNodeDelegator,
        isXNodeDelegatee: node.isXNodeDelegatee,
        delegatee: node.delegatee,
      }))
    },
  })

  const nodes = userNodes?.data

  // For each node, call isLegacyNode to determine if it is a legacy node or not
  const isLegacyCheckCalls = useMemo(() => {
    if (!nodes) return []
    return (nodes as UserNode[]).map(
      ({ nodeId }): UseCallParams<any> => ({
        contractInterface,
        contractAddress,
        method: "isLegacyNode",
        args: [nodeId],
        mapResponse: res => {
          if (!res.decoded) return { nodeId, isLegacyNode: false }
          return {
            nodeId,
            isLegacyNode: res.decoded[0],
          }
        },
      }),
    )
  }, [nodes])

  const { data: nodeIdsWithIsLegacy } = useMultipleCalls(isLegacyCheckCalls)

  //Merge nodeIdsWithIsLegacy with nodes based on nodeId
  const allNodesWithIsLegacy = useMemo(() => {
    if (!nodeIdsWithIsLegacy || !nodes) return []
    return nodes.map((node: UserNode, index: number) => ({
      ...node,
      isLegacyNode: nodeIdsWithIsLegacy[index].isLegacyNode,
    }))
  }, [nodeIdsWithIsLegacy, nodes])

  return {
    ...userNodes,
    data: allNodesWithIsLegacy,
  }
}

// For backward compatibility (if needed)
export const useGetUserNode = useGetUserNodes
