import { getConfig } from "@repo/config"
import { StargateNFT__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const abi = StargateNFT__factory.abi
const address = getConfig().stargateNFTContractAddress
const method = "getTokenManager" as const
/**
 * Get the query key for the address of the user managing the node ID (endorsement)
 * @param nodeId The ID of the node for which the manager address is being retrieved
 */
export const getNodeManagerQueryKey = (nodeId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(nodeId)] })
/**
 * Hook to get the address of the user managing the node ID (endorsement) either through ownership or delegation
 * @param nodeId The ID of the node for which the manager address is being retrieved
 * @returns address The address of the manager of the specified node
 */
export const useGetNodeManager = (nodeId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(nodeId)],
    queryOptions: {
      enabled: !!nodeId,
      select: data => data[0],
    },
  })
}
