import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "MAX_LEVEL" as const

export const getGMMaxLevelQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get the max level of the GM NFT.
 * @returns The max level of the GM NFT.
 */
export const useGMMaxLevel = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => Number(data[0]),
    },
  })
}
