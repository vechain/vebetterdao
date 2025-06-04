import { allNodeStrengthLevelToName } from "@/constants/XNode"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"
import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"

const X2EARN_APPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

export type NodeEndorsementScore = Record<number, number>

/**
 * Returns a mapping between node levels and the endorsement score from the contract
 * @param thor  the thor client
 * @returns  the endorsement score for the user
 */
export const getNodesEndorsementScore = async (thor: ThorClient): Promise<NodeEndorsementScore> => {
  const nodeStrengthLevelArray = Object.keys(allNodeStrengthLevelToName).map(Number)
  const contract = thor.contracts.load(X2EARN_APPPS_CONTRACT, X2EarnApps__factory.abi)

  const levelToScore: NodeEndorsementScore = {}

  // Get endorsement scores for all node levels
  for (const level of nodeStrengthLevelArray) {
    const res = await contract.read.nodeLevelEndorsementScore(BigInt(level))

    if (!res) throw new Error(`Error fetching endorsement score for level ${level}`)

    levelToScore[level] = Number(res[0])
  }

  return levelToScore
}

export const getNodesEndorsementScoreQueryKey = () => ["XNodes", "ENDORSEMENT_SCORE"]

/**
 *  Hook to get the endorsement score of all the node levels
 * @returns an object with the endorsement score for each node level
 *
 */
export const useNodesEndorsementScore = () => {
  const thor = useThor()

  return useQuery({
    queryKey: getNodesEndorsementScoreQueryKey(),
    queryFn: async () => await getNodesEndorsementScore(thor),
    enabled: !!thor,
  })
}
