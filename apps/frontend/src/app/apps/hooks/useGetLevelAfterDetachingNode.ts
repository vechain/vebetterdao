import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause } from "@vechain/vechain-kit"

const abi = GalaxyMember__factory.abi
const method = "getLevelAfterDetachingNode" as const
const address = getConfig().galaxyMemberContractAddress as `0x${string}`
export const useGetLevelAfterDetachingNode = (tokenId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId)],
    queryOptions: {
      select: data => data[0].toString(),
    },
  })
}
