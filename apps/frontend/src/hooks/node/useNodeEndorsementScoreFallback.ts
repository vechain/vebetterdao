import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import {
  StargateNFT__factory,
  NodeManagementV3__factory,
  X2EarnApps__factory,
} from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const x2EarnAppsAbi = X2EarnApps__factory.abi
const x2EarnAppsContractAddress = getConfig().x2EarnAppsContractAddress

const stargateNFTAbi = StargateNFT__factory.abi
const stargateNFTContractAddress = getConfig().stargateNFTContractAddress

const nodeManagementAbi = NodeManagementV3__factory.abi
const nodeManagementContractAddress = getConfig().nodeManagementContractAddress

const x2EarnAppsGetNodeEndorsementScoreMethod = "nodeLevelEndorsementScore" as const

const stargateNFTCheckTokenExistsMethod = "tokenExists" as const
const stargateNFTGetNodeLevelMethod = "getTokenLevel" as const
const nodeManagementGetNodeLevelMethod = "getNodeLevel" as const

/**
 * Get the query key for the address of the user managing the node ID (endorsement)
 * @param nodeId The ID of the node for which the manager address is being retrieved
 */
export const getNodeEndorsementScoreFallbackQueryKey = (nodeId: string) => [
  "node-endorsement-score-fallback",
  BigInt(nodeId),
]
/**
 * Hook to get the address of the user managing the node ID (endorsement) either through ownership or delegation
 * @param nodeId The ID of the node for which the manager address is being retrieved
 * @returns address The address of the manager of the specified node
 */
export const useNodeEndorsementScoreFallback = (nodeId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getNodeEndorsementScoreFallbackQueryKey(nodeId),
    queryFn: async () => {
      const [isStargateToken] = await executeMultipleClausesCall({
        thor,
        calls: [
          {
            abi: stargateNFTAbi,
            address: stargateNFTContractAddress as `0x${string}`,
            functionName: stargateNFTCheckTokenExistsMethod,
            args: [BigInt(nodeId)],
          },
        ],
      })

      const [nodeLevel] = await executeMultipleClausesCall({
        thor,
        calls: isStargateToken
          ? [
              {
                abi: stargateNFTAbi,
                address: stargateNFTContractAddress as `0x${string}`,
                functionName: stargateNFTGetNodeLevelMethod,
                args: [BigInt(nodeId)],
              },
            ]
          : [
              {
                abi: nodeManagementAbi,
                address: nodeManagementContractAddress as `0x${string}`,
                functionName: nodeManagementGetNodeLevelMethod,
                args: [BigInt(nodeId)],
              },
            ],
      })

      const [nodeEndorsementScore] = await executeMultipleClausesCall({
        thor,
        calls: [
          {
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress as `0x${string}`,
            functionName: x2EarnAppsGetNodeEndorsementScoreMethod,
            args: [Number(nodeLevel)],
          },
        ],
      })

      return nodeEndorsementScore
    },
  })
}
