import { useCallClause } from "@vechain/vechain-kit"
import { GalaxyMember__factory } from "@repo/contracts/typechain-types"
import { getConfig } from "@repo/config"

const abi = GalaxyMember__factory.abi
const method = "getLevelAfterDetachingNode" as const
const address = getConfig().galaxyMemberContractAddress as `0x${string}`

export const useGetLevelAfterDetachingNode = (tokenId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId)],
  })
}
