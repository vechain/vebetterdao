import { executeMultipleClausesCall } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@vechain-kit/vebetterdao-contracts"
import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/dapp-kit-react"
import { ThorClient } from "@vechain/sdk-network"
import { allNodeStrengthLevelToName, NodeStrengthLevelToImage } from "@/constants/XNode"

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
 * @param networkType  the network type
 * @param user  the user address
 * @returns  all the available xNodes for an user
 */
export const getUserXNodes = async (thor: ThorClient, user?: string): Promise<UserXNode[]> => {
  if (!user) throw new Error("User address is required")
  const contractAddress = getConfig().nodeManagementContractAddress as `0x${string}`

  const [nodeIds = [], levels = []] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: NodeManagement__factory.abi,
        address: contractAddress,
        functionName: "getNodeIds",
        args: [(user ?? "0x") as `0x${string}`],
      },
      {
        abi: NodeManagement__factory.abi,
        address: contractAddress,
        functionName: "getUsersNodeLevels",
        args: [(user ?? "0x") as `0x${string}`],
      },
    ],
  })

  if (nodeIds.length !== levels.length) throw new Error("Error fetching Nodes - Data is corrupted")

  return nodeIds.map((id, index) => {
    return {
      id: id.toString(),
      level: Number(levels[index]),
      image: NodeStrengthLevelToImage[Number(levels[index])] as string,
      name: allNodeStrengthLevelToName[Number(levels[index])] as string,
    }
  })
}

export const getUserXNodesQueryKey = (user?: string) => ["VECHAIN_KIT", "XNodes", user]

/**
 *  Hook to get the owned or delegated xNodes for a user from the NodeManagement contract
 * @param user  the user address
 * @returns  the xNodes for the user
 */
export const useXNodes = (user?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getUserXNodesQueryKey(user),
    queryFn: async () => await getUserXNodes(thor, user),
    enabled: !!thor && !!user,
  })
}
