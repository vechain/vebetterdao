import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi } from "thor-devkit"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
const nodeToEndorsementAppFragment = X2EarnApps__factory.createInterface()
  .getFunction("nodeToEndorsedApp")
  .format("json")

const nodeToEndorsementAppFragmentAbi = new abi.Function(JSON.parse(nodeToEndorsementAppFragment))

type NodeEndorsedApp = {
  id: string
  endorsedApp?: string | null
}

/**
 * Returns a mapping between node ids and the endorsed apps from the contract
 * @param thor  the thor client
 * @param nodeIds  the node ids to fetch the endorsed apps for
 * @returns  the endorsed apps for the nodes
 */
export const getNodesEndorsedApps = async (thor: Connex.Thor, nodeIds: string[]): Promise<NodeEndorsedApp[]> => {
  const clauses = nodeIds.map(nodeId => ({
    to: X2EARNAPPS_CONTRACT,
    value: 0,
    data: nodeToEndorsementAppFragmentAbi.encode(nodeId),
  }))

  const res = await thor.explain(clauses).execute()

  const error = res.find(r => r.reverted)?.revertReason

  if (error) throw new Error(error ?? "Error fetching endorsed apps")

  if (res.length !== nodeIds.length) throw new Error("Error fetching endorsed apps")

  return res.map((r, index) => {
    let decoded = nodeToEndorsementAppFragmentAbi.decode(r.data)[0]
    // if not endorsed app, address is 0x0
    if (decoded === "0x0000000000000000000000000000000000000000000000000000000000000000") decoded = null

    return {
      id: nodeIds[index] as string,
      endorsedApp: decoded as string | null,
    }
  })
}

export const getNodesEndorsedAppsQueryKey = (nodeIds: string[]) => ["XNodes", ...nodeIds, "ENDORSED_APPS"]

/**
 *  Hook to get the endorsed apps for a user's nodes
 * @param nodeIds  the node ids to fetch the endorsed apps for
 * @returns  the endorsed apps for the nodes
 */
export const useNodesEndorsedApps = (nodeIds: string[]) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getNodesEndorsedAppsQueryKey(nodeIds),
    queryFn: async () => await getNodesEndorsedApps(thor, nodeIds),
    enabled: !!thor,
  })
}
