import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = GalaxyMember__factory.abi
const method = "getLevelAfterAttachingNode" as const
const address = getConfig().galaxyMemberContractAddress as `0x${string}`

export const getGetLevelAfterAttachingNodeQueryKey = (tokenId: string, nodeTokenId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(tokenId), BigInt(nodeTokenId)] })

export const useGetLevelAfterAttachingNode = ({
  tokenId,
  nodeTokenId,
  enabled = true,
}: {
  tokenId: string
  nodeTokenId: string
  enabled?: boolean
}) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId), BigInt(nodeTokenId)],
    queryOptions: {
      enabled,
      select: data => data[0].toString(),
    },
  })
}
