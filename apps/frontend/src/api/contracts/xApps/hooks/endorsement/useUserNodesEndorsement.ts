import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, ThorClient, useThor } from "@vechain/vechain-kit"
import { zeroAddress } from "viem"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress as `0x${string}`
const method = "nodeToEndorsedApp" as const

/**
 * Returns a mapping between node ids and the endorsed apps from the contract
 * one node can endorse one app
 * @param thor  the thor client
 * @param nodeIds  the node ids to fetch the endorsed apps for
 * @returns  the endorsed apps for the nodes
 */
export const getNodesEndorsedApps = async (thor: ThorClient, nodeIds: string[]) => {
  const res = await executeMultipleClausesCall({
    thor,
    calls: nodeIds.map(
      nodeId =>
        ({
          abi,
          address,
          functionName: method,
          args: [nodeId as `0x${string}`],
        }) as const,
    ),
  })

  if (res.length !== nodeIds.length) throw new Error("Error fetching endorsed apps")

  return res.map((address, index) => {
    return {
      id: nodeIds[index] as string,
      endorsedApp: address === zeroAddress ? null : address,
    }
  })
}

export const getNodesEndorsedAppsQueryKey = (nodeIds: string[]) => ["XNodes", nodeIds, "ENDORSED_APPS"]

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
