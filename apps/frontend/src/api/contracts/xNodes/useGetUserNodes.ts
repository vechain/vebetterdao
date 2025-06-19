import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"

const address = getConfig().nodeManagementContractAddress as `0x${string}`
const abi = NodeManagement__factory.abi
const method = "getUserNodes" as const

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
 * Get the query key for fetching user nodes
 * @param user - The address of the user to check
 */
export const getUserNodesQueryKey = (user?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(user ?? "0x") as `0x${string}`] })

/**
 * Hook to get delegation details for all nodes associated with a user
 * @param user - The address of the user to check
 * @returns An array of objects containing user node details
 */
export const useGetUserNodes = (user?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(user ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!user,
      select: data =>
        data[0].map(
          node =>
            ({
              nodeId: node.nodeId.toString(),
              nodeLevel: node.nodeLevel,
              xNodeOwner: node.xNodeOwner,
              isXNodeHolder: node.isXNodeHolder,
              isXNodeDelegated: node.isXNodeDelegated,
              isXNodeDelegator: node.isXNodeDelegator,
              isXNodeDelegatee: node.isXNodeDelegatee,
              delegatee: node.delegatee,
            }) as UserNode,
        ),
    },
  })
}

// For backward compatibility (if needed)
export const useGetUserNode = useGetUserNodes
