import { useWallet, executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory, VoterRewards__factory } from "@vechain/vebetterdao-contracts"
import { useQuery } from "@tanstack/react-query"
import { NFTMetadata, getIpfsMetadata } from "@/api"
import { gmNfts } from "@/constants/gmNfts"
import { notFoundImage } from "@/constants"
import { formatEther } from "viem"

const galaxyMemberContractAddress = getConfig().galaxyMemberContractAddress
const galaxyMemberAbi = GalaxyMember__factory.abi

const voterRewardsContractAddress = getConfig().voterRewardsContractAddress
const voterRewardsAbi = VoterRewards__factory.abi

const PAGE_SIZE = 10

/**
 * Returns the query key for fetching the GM balance.
 * @param userAddress The user address to get the balance for
 * @returns The query key for fetching the GM balance.
 */
export const getUserGMsQueryKey = (userAddress: string) => ["user-gms", userAddress]

export interface UserGM {
  tokenId: string
  tokenURI: string
  tokenLevel: string
  b3trToUpgrade: string
  isSelected: boolean
  multiplier?: number
  nodeIdAttached?: string
  metadata?: NFTMetadata
}

/**
 * Hook to get the number of GM NFTs for an address
 * @param userAddress The address to get the number of GM NFTs owned
 * @returns the number of GM NFTs for the address
 */
export const useGetUserGMs = (userAddress?: string) => {
  const { account } = useWallet()
  const thor = useThor()
  const address = userAddress ?? account?.address ?? ""

  return useQuery({
    queryKey: getUserGMsQueryKey(address),
    queryFn: async () => {
      const [selectedTokenId, userGMs] = await executeMultipleClausesCall({
        thor,
        calls: [
          {
            abi: galaxyMemberAbi,
            address: galaxyMemberContractAddress as `0x${string}`,
            functionName: "getSelectedTokenId",
            args: [address as `0x${string}`],
          },
          {
            abi: galaxyMemberAbi,
            address: galaxyMemberContractAddress as `0x${string}`,
            functionName: "getTokensInfoByOwner",
            args: [address as `0x${string}`, BigInt(0), BigInt(PAGE_SIZE)],
          },
        ],
      })

      const [multipliers, attachedNodeIds] = await Promise.all([
        executeMultipleClausesCall({
          thor,
          calls: userGMs.map(
            gm =>
              ({
                abi: voterRewardsAbi,
                address: voterRewardsContractAddress as `0x${string}`,
                functionName: "levelToMultiplier",
                args: [BigInt(gm.tokenLevel)],
              }) as const,
          ),
        }),
        executeMultipleClausesCall({
          thor,
          calls: userGMs.map(
            gm =>
              ({
                abi: galaxyMemberAbi,
                address: galaxyMemberContractAddress as `0x${string}`,
                functionName: "getNodeIdAttached",
                args: [gm.tokenId],
              }) as const,
          ),
        }),
      ])

      let metadata: (NFTMetadata | undefined)[] = (
        await Promise.allSettled(userGMs.map(gm => getIpfsMetadata<NFTMetadata>(gm.tokenURI)))
      ).map(result => (result.status === "fulfilled" ? result.value : undefined))

      return userGMs.map((gm, index) => {
        const nftMetadata = metadata[index]
        const image = nftMetadata?.image
          ? `https://api.gateway-proxy.vechain.org/ipfs/${nftMetadata?.image.replace("ipfs://", "")}`
          : gmNfts[Number(gm.tokenLevel) - 1]?.image || notFoundImage
        const nftName = nftMetadata?.name || gmNfts[Number(gm.tokenLevel) - 1]?.name
        const name = `${nftName} #${gm.tokenId}`
        return {
          tokenId: gm.tokenId.toString(),
          tokenURI: gm.tokenURI,
          tokenLevel: gm.tokenLevel.toString(),
          b3trToUpgrade: formatEther(gm.b3trToUpgrade),
          isSelected: gm.tokenId === selectedTokenId,
          multiplier: multipliers[index] ? Number(multipliers[index]) / 100 : undefined,
          nodeIdAttached: attachedNodeIds[index]?.toString(),
          metadata: {
            name,
            description: metadata[index]?.description,
            image,
            attributes: metadata[index]?.attributes,
          },
        } as UserGM
      })
    },
    enabled: !!address,
  })
}
