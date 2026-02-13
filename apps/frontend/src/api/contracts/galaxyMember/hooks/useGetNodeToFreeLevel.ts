import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "getNodeToFreeLevel" as const

export const getNodeToFreeLevelQueryKey = (nodeLevel: number) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [nodeLevel] })

/**
 * Returns the GM level a node can upgrade to for free based on its node level.
 * Returns "0" if the node does not grant any free upgrade.
 *
 * @param nodeLevel - The level of the VeChain node (levelId from UserNode)
 */
export const useGetNodeToFreeLevel = (nodeLevel?: number) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [nodeLevel ?? 0],
    queryOptions: {
      enabled: nodeLevel !== undefined,
      select: data => data[0].toString(),
    },
  })
}
