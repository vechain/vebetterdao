import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { StargateNFT__factory, NodeManagementV3__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const stargateNFTAbi = StargateNFT__factory.abi
const stargateNFTContractAddress = getConfig().stargateNFTContractAddress

const nodeManagementAbi = NodeManagementV3__factory.abi
const nodeManagementContractAddress = getConfig().nodeManagementContractAddress

const stargateNFTGetManagerMethod = "getTokenManager" as const
const stargateNFTCheckTokenExistsMethod = "tokenExists" as const

const nodeManagementGetNodeManagerMethod = "getNodeManager" as const

/**
 * Get the query key for the address of the user managing the node ID (endorsement)
 * @param nodeId The ID of the node for which the manager address is being retrieved
 */
export const getNodeManagerFallbackQueryKey = (nodeId: string) => ["node-manager-fallback", BigInt(nodeId)]
/**
 * Hook to get the address of the user managing the node ID (endorsement) either through ownership or delegation
 * @param nodeId The ID of the node for which the manager address is being retrieved
 * @returns address The address of the manager of the specified node
 */
export const useGetNodeManagerFallback = (nodeId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getNodeManagerFallbackQueryKey(nodeId),
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

      const [manager] = await executeMultipleClausesCall({
        thor,
        calls: isStargateToken
          ? [
              {
                abi: stargateNFTAbi,
                address: stargateNFTContractAddress as `0x${string}`,
                functionName: stargateNFTGetManagerMethod,
                args: [BigInt(nodeId)],
              },
            ]
          : [
              {
                abi: nodeManagementAbi,
                address: nodeManagementContractAddress as `0x${string}`,
                functionName: nodeManagementGetNodeManagerMethod,
                args: [BigInt(nodeId)],
              },
            ],
      })

      return manager
    },
  })
}
