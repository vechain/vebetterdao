import { allNodeStrengthLevelToName } from "@/constants/XNode"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi } from "thor-devkit"
const X2EARN_APPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
const getNodeScoreFragment = X2EarnApps__factory.createInterface()
  .getFunction("nodeLevelEndorsementScore")
  .format("json")
const getNodeScoreAbi = new abi.Function(JSON.parse(getNodeScoreFragment))

/**
 * UserXNode type for the xNodes owned by a user
 * @property id  the xNode id
 * @property level  the xNode level
 * @property image  the xNode image
 * @property name  the xNode name
 */
export type NodeEndorsementScore = Record<number, number>

/**
 * Returns a mappaing between node levels and the endorsement score from the contract
 * @param thor  the thor client
 * @returns  the endorsement score for the user
 */
export const getNodesEndorsementScore = async (thor: Connex.Thor): Promise<NodeEndorsementScore> => {
  const nodeStrengthLevelArray = Object.keys(allNodeStrengthLevelToName).map(Number)

  const clauses = nodeStrengthLevelArray.map(level => {
    return {
      to: X2EARN_APPPS_CONTRACT,
      value: 0,
      data: getNodeScoreAbi.encode(level),
    }
  })

  const res = await thor.explain(clauses).execute()

  const error = res.find(r => r.reverted)?.revertReason

  if (error) throw new Error(error ?? "Error fetching nods endorsement score")

  if (!res[0]) throw new Error("Error fetching nods endorsement score")
  const endorsementScore: string[] = getNodeScoreAbi.decode(res[0]?.data)[0]

  const levelToScore: NodeEndorsementScore = {}
  nodeStrengthLevelArray.forEach((level, index) => {
    levelToScore[level] = Number(endorsementScore[index])
  })

  return levelToScore
}

export const getNodesEndorsementScoreQueryKey = () => ["XNodes", "ENDORSEMENT_SCORE"]

/**
 *  Hook to get the endorsement score of all the node levels
 * @returns an object with the endorsement score for each node level
 *
 */
export const useNodesLevelsEndorsementScore = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getNodesEndorsementScoreQueryKey(),
    queryFn: async () => await getNodesEndorsementScore(thor),
    enabled: !!thor,
  })
}
