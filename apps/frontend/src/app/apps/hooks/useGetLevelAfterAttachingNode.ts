import { useCallClause } from "@vechain/vechain-kit"
import { GalaxyMember__factory } from "@repo/contracts/typechain-types"
import { getConfig } from "@repo/config"

const abi = GalaxyMember__factory.abi
const method = "getLevelAfterAttachingNode" as const
const address = getConfig().galaxyMemberContractAddress as `0x${string}`

export const useGetLevelAfterAttachingNode = ({ tokenId, nodeTokenId }: { tokenId: string; nodeTokenId: string }) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId), BigInt(nodeTokenId)],
    queryOptions: {
      select: data => data[0].toString(),
    },
  })
}
