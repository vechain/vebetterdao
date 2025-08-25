import { allNodeStrengthLevelToName } from "@/constants/XNode"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, ThorClient, useThor } from "@vechain/vechain-kit"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress as `0x${string}`
const method = "nodeLevelEndorsementScore" as const

/**
 * Returns a mappaing between node levels and the endorsement score from the contract
 * @param thor  the thor client
 * @returns  the endorsement score for the user
 */
export const getNodesEndorsementScore = async (thor: ThorClient) => {
  const nodeStrengthLevelArray = Object.keys(allNodeStrengthLevelToName).map(Number)

  const res = await executeMultipleClausesCall({
    thor,
    calls: nodeStrengthLevelArray.map(
      level =>
        ({
          abi,
          address,
          functionName: method,
          args: [level],
        }) as const,
    ),
  })

  if (res.length !== nodeStrengthLevelArray.length) throw new Error("Error fetching nodes endorsement score")

  const levelToScore: Record<number, number> = {}
  res.forEach((score, index) => {
    const level = nodeStrengthLevelArray[index] as number
    levelToScore[level] = Number(score)
  })

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
