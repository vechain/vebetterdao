import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"
import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

// NOTE: one node can endorse one app
type NodeEndorsedApp = {
  // node id
  id: string
  endorsedApp?: string | null
}

/**
 * Returns a mapping between node ids and the endorsed apps from the contract
 * one node can endorse one app
 * @param thor  the thor client
 * @param nodeIds  the node ids to fetch the endorsed apps for
 * @returns  the endorsed apps for the nodes
 */
export const getNodesEndorsedApps = async (thor: ThorClient, nodeIds: string[]): Promise<NodeEndorsedApp[]> => {
  const contract = thor.contracts.load(X2EARNAPPS_CONTRACT, X2EarnApps__factory.abi)
  const results: NodeEndorsedApp[] = []

  for (const nodeId of nodeIds) {
    const res = await contract.read.nodeToEndorsedApp(nodeId)

    if (!res) throw new Error(`Error fetching endorsed app for node ${nodeId}`)

    let endorsedApp: string | null = res[0] as string
    // if not endorsed app, address is 0x0
    if (endorsedApp === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      endorsedApp = null
    }

    results.push({
      id: nodeId,
      endorsedApp,
    })
  }

  return results
}

export const getNodesEndorsedAppsQueryKey = (nodeIds: string[]) => ["XNodes", ...nodeIds, "ENDORSED_APPS"]

/**
 *  Hook to get the endorsed apps for a user's nodes
 * @param nodeIds  the node ids to fetch the endorsed apps for
 * @returns  the endorsed apps for the nodes
 */
export const useNodesEndorsedApps = (nodeIds: string[]) => {
  const thor = useThor()

  return useQuery({
    queryKey: getNodesEndorsedAppsQueryKey(nodeIds),
    queryFn: async () => await getNodesEndorsedApps(thor, nodeIds),
    enabled: !!thor && !!nodeIds?.length,
  })
}

/**
 *  Hook to get the endorsed app for a single node
 * @param nodeId  the node id to fetch the endorsed app for
 * @returns  the endorsed app for the node
 */
export const useNodeEndorsedApp = (nodeId?: string) => {
  const { data, ...rest } = useNodesEndorsedApps(nodeId ? [nodeId] : [])

  return {
    data: data?.[0]?.endorsedApp,
    ...rest,
  }
}
