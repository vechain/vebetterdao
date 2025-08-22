import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "getNodeEndorsementScore" as const

/**
 * Get the query key for the endorsement score of a node ID.
 */
export const getEndorsersQueryKey = (nodeId: string) => {
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(nodeId)] })
}

/**
 * Hook that fetches the endorsement score of a node ID
 * @param nodeId the node Id of the endorser
 *
 * @returns the endorsement score
 */
export const useNodeEndorsementScore = (nodeId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(nodeId)],
    queryOptions: {
      enabled: !!nodeId,
      select: data => data[0].toString(),
    },
  })
}
