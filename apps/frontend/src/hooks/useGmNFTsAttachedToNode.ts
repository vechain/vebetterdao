import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { GalaxyMember__factory, VoterRewards__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { getIpfsImage, getIpfsMetadata, IpfsImage } from "@/api/ipfs"
import { NFTMetadata } from "@/api/contracts/galaxyMember/hooks/useNFTImage"
import { notFoundImage } from "@/constants"
import { gmNfts } from "@/constants/gmNfts"

const galaxyMemberAbi = GalaxyMember__factory.abi
const galaxyMemberAddress = getConfig().galaxyMemberContractAddress
const galaxyMemberMethod = "getIdAttachedToNode" as const

const voterRewardsAddress = getConfig().voterRewardsContractAddress
const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsMethod = "levelToMultiplier" as const

export const getGmNFTsAttachedToNodeKeys = (nodeIds: string[]) => ["gmNFTsAttachedToNode", nodeIds]

export interface GmNFTData {
  tokenId: string
  level: number
  multiplier: number
  metadata: NFTMetadata
}

export const useGmNFTsAttachedToNode = (
  nodeIds: string[],
  options?: {
    withMetadata?: boolean
    enabled?: boolean
  },
) => {
  const { withMetadata = false, enabled = true } = options ?? {}

  const thor = useThor()

  return useQuery({
    queryKey: getGmNFTsAttachedToNodeKeys(nodeIds),
    queryFn: async () => {
      const tokenIds = await executeMultipleClausesCall({
        thor,
        calls: nodeIds.map(nodeId => ({
          abi: galaxyMemberAbi,
          address: galaxyMemberAddress,
          functionName: galaxyMemberMethod,
          args: [nodeId as `0x${string}`],
        })),
      })

      const tokenLevels = await executeMultipleClausesCall({
        thor,
        calls: tokenIds.map(
          tokenId =>
            ({
              abi: galaxyMemberAbi,
              address: galaxyMemberAddress,
              functionName: "levelOf",
              args: [tokenId],
            }) as const,
        ),
      })

      const tokenMultipliers = await executeMultipleClausesCall({
        thor,
        calls: tokenLevels.map(
          level =>
            ({
              abi: voterRewardsAbi,
              address: voterRewardsAddress,
              functionName: voterRewardsMethod,
              args: [level],
            }) as const,
        ),
      })

      let metadata: NFTMetadata[] | undefined
      let images: IpfsImage[] | undefined

      if (withMetadata) {
        const metadataUris = await executeMultipleClausesCall({
          thor,
          calls: tokenIds.map(
            tokenId =>
              ({
                abi: galaxyMemberAbi,
                address: galaxyMemberAddress,
                functionName: "tokenURI",
                args: [tokenId],
              }) as const,
          ),
        })

        metadata = await Promise.all(metadataUris.map(uri => getIpfsMetadata<NFTMetadata>(uri)))
        images = await Promise.all(metadata.map(meta => getIpfsImage(meta?.image)))
      }

      return tokenIds.map((tokenId, index) => {
        const level = tokenLevels[index]
        const multiplier = tokenMultipliers[index]

        const gmImage = images?.[index]?.image || notFoundImage
        const nftName = metadata?.[index]?.name || gmNfts[Number(level) - 1]?.name
        const name = `${nftName} #${tokenId}`

        return {
          tokenId: tokenId.toString(),
          level: Number(level),
          multiplier: Number(multiplier),
          metadata: {
            name,
            image: gmImage,
            description: metadata?.[index]?.description,
            attributes: metadata?.[index]?.attributes,
          },
        } as GmNFTData
      })
    },
    enabled,
  })
}
