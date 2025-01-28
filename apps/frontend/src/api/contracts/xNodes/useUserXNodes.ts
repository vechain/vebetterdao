import { allNodeStrengthLevelToName, NodeStrengthLevelToImage } from "@/constants/XNode"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useWallet } from "@vechain/vechain-kit"
import { abi } from "thor-devkit"
const NODEMANAGEMENT_CONTRACT = getConfig().nodeManagementContractAddress
const getNodeIdsFragment = NodeManagement__factory.createInterface().getFunction("getNodeIds").format("json")
const getNodeLevelsFragment = NodeManagement__factory.createInterface().getFunction("getUsersNodeLevels").format("json")
const getNodeIdsAbi = new abi.Function(JSON.parse(getNodeIdsFragment))
const getNodeLevelsAbi = new abi.Function(JSON.parse(getNodeLevelsFragment))

/**
 * UserXNode type for the xNodes owned by a user
 * @property id  the xNode id
 * @property level  the xNode level
 * @property image  the xNode image
 * @property name  the xNode name
 */
export type UserXNode = {
  id: string
  level: number
  image: string
  name: string
}

/**
 * Returns all the available (owned and delegated) xNodes from the NodeManagement contract
 * @param thor  the thor client
 * @returns  all the available xNodes for an user
 */
export const getUserXNodes = async (thor: Connex.Thor, user?: string): Promise<UserXNode[]> => {
  if (!user) throw new Error("User address is required")
  const clauses = [
    {
      to: NODEMANAGEMENT_CONTRACT,
      value: 0,
      data: getNodeIdsAbi.encode(user),
    },
    {
      to: NODEMANAGEMENT_CONTRACT,
      value: 0,
      data: getNodeLevelsAbi.encode(user),
    },
  ]

  const res = await thor.explain(clauses).execute()

  const error = res.find(r => r.reverted)?.revertReason

  if (error) throw new Error(error ?? "Error fetching xApps")

  if (!res[0] || !res[1]) throw new Error("Error fetching Nodes - Data is missing")
  let nodeIds: string[] = getNodeIdsAbi.decode(res[0]?.data)[0]
  let levels: string[] = getNodeLevelsAbi.decode(res[1]?.data)[0]

  if (nodeIds.length !== levels.length) throw new Error("Error fetching Nodes - Data is corrupted")

  return nodeIds.map((id, index) => {
    return {
      id,
      level: Number(levels[index]),
      image: NodeStrengthLevelToImage[Number(levels[index])] as string,
      name: allNodeStrengthLevelToName[Number(levels[index])] as string,
    }
  })
}

export const getUserXNodesQueryKey = (user?: string) => ["XNodes", user]

/**
 *  Hook to get the owned or delegated xNodes for a user from the NodeManagement contract
 * @param user  the user address
 * @returns  the xNodes for the user
 */
export const useXNodes = (user?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getUserXNodesQueryKey(user),
    queryFn: async () => await getUserXNodes(thor, user),
    enabled: !!thor && !!user,
  })
}

/**
 *  Hook to get the owned or delegated xNodes for a user from the NodeManagement contract
 * @returns  the xNodes for the user
 */
export const useUserXNodes = () => {
  const { account } = useWallet()
  return useXNodes(account?.address || undefined)
}
