import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"

const contractAbi = NodeManagement__factory.abi
const method = "getNodeManager" as const

/**
 * Get the query key for the address of the user managing the node ID (endorsement)
 * @param nodeId The ID of the node for which the manager address is being retrieved
 */
export const getNodeManagerQueryKey = (nodeId: string) =>
  getCallClauseQueryKey<typeof contractAbi>({
    address: getConfig().nodeManagementContractAddress,
    method,
    args: [BigInt(nodeId || 0)],
  })

/**
 * Hook to get the address of the user managing the node ID (endorsement) either through ownership or delegation
 * @param nodeId The ID of the node for which the manager address is being retrieved
 * @returns address The address of the manager of the specified node
 */
export const useGetNodeManager = (nodeId: string) => {
  const contractAddress = getConfig().nodeManagementContractAddress

  // Node Management get node manager result: [ '0xf84090b27109454feE78987ae123EC7AEe4c27aE' ]
  return useCallClause({
    abi: contractAbi,
    address: contractAddress,
    method: "getNodeManager",
    args: [BigInt(nodeId || 0)],
    queryOptions: {
      enabled: !!nodeId && !!contractAddress,
      select: data => data[0],
    },
  })
}
