import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { StargateNFT__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause } from "@vechain/vechain-kit"

import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { notFoundImage } from "@/constants"
import { convertUriToUrl } from "@/utils/uri"

const address = getConfig().stargateNFTContractAddress as `0x${string}`
const abi = StargateNFT__factory.abi

type NodeMetadata = {
  name: string
  image: string
}

export const useNodeMetadata = (nodeId?: string) => {
  const { data: tokenUri } = useCallClause({
    abi,
    address,
    method: "tokenURI",
    args: [BigInt(nodeId ?? "0")],
    queryOptions: {
      enabled: !!nodeId,
      select: data => data[0] as string,
    },
  })

  return useQuery<NodeMetadata>({
    queryKey: ["NODE_METADATA", nodeId],
    queryFn: async () => {
      const raw = await getIpfsMetadata<{ name?: string; image?: string }>(tokenUri)
      return {
        name: raw?.name ?? "",
        image: raw?.image ? convertUriToUrl(raw.image) : notFoundImage,
      }
    },
    enabled: !!nodeId && !!tokenUri,
    staleTime: Infinity,
  })
}
