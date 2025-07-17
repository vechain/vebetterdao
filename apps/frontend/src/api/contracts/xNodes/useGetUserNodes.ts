import { executeMultipleClausesCall, useThor, executeCallClause } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { useQuery } from "@tanstack/react-query"

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
type UserNodeWithIsLegacy = UserNode & {
  isLegacyNode: boolean
}

/**
 * Get the query key for fetching user nodes
 * @param user - The address of the user to check
 */
export const getUserNodesQueryKey = (user?: string) => ["userNodes", user]

/**
 * Hook to get delegation details for all nodes associated with a user
 * @param user - The address of the user to check
 * @returns An array of objects containing user node details
 */
export const useGetUserNodes = (user?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getUserNodesQueryKey(user),
    queryFn: async () => {
      const [userNodes = []] =
        (await executeCallClause({
          thor,
          abi,
          contractAddress: address,
          method,
          args: [(user ?? "0x") as `0x${string}`],
        })) || []

      const isLegacyCheckCalls = await executeMultipleClausesCall({
        thor,
        calls: userNodes.map(
          node =>
            ({
              abi,
              address,
              functionName: "isLegacyNode",
              args: [node.nodeId],
            }) as const,
        ),
      })

      return userNodes.map(
        (node, index) =>
          ({
            ...node,
            nodeId: node.nodeId.toString(),
            isLegacyNode: isLegacyCheckCalls[index] ?? true,
          }) as UserNodeWithIsLegacy,
      )
    },
  })
}

// For backward compatibility (if needed)
export const useGetUserNode = useGetUserNodes
