import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { StargateNFT__factory, X2EarnApps__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"

import { getIpfsMetadata } from "../../ipfs/hooks/useIpfsMetadata"

const x2EarnAppsContractAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`
const stargateNFTContractAddress = getConfig().stargateNFTContractAddress as `0x${string}`

const x2EarnAppsAbi = X2EarnApps__factory.abi
const stargateNFTAbi = StargateNFT__factory.abi

//TODO: Replace by dynamic type inference
type StargateNFTMetadata = {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string
  }[]
}

/**
 * Get the query key for fetching user nodes
 * @param user - The address of the user to check
 */
export const getUserNodesQueryKey = (user?: string) => ["userNodes", user]

/**
 * Hook to get delegation details for all nodes associated with a user
 * @param user - The address of the user to check
 * @returns An array of objects containing user node details
 * @dev Legacy nodes are not supported anymore , the only information we get is if the user still have legacy nodes,
 * if so, we display a banner, but not UI anymore
 */
export const useGetUserNodes = (user?: string) => {
  const thor = useThor()
  const { account } = useWallet()
  const userAddress = user ?? account?.address
  return useQuery({
    queryKey: getUserNodesQueryKey(userAddress),
    queryFn: async () => {
      const [tokensOverview, usersEndorsementScore] = await executeMultipleClausesCall({
        thor,
        calls: [
          {
            abi: stargateNFTAbi,
            address: stargateNFTContractAddress,
            functionName: "tokensOverview",
            args: [userAddress as `0x${string}`],
          },
          {
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "getUsersEndorsementScore",
            args: [userAddress as `0x${string}`],
          },
        ],
      })

      const nodeIds = tokensOverview?.map(token => token.id.toString())
      let nodePoints: bigint[] = []
      let nodeMetadata: StargateNFTMetadata[] = []
      if (nodeIds?.length > 0) {
        // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
        nodePoints = await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "getNodeEndorsementScore",
            args: [BigInt(nodeId)],
          })),
        })
        // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
        const rawNodeMetadata = await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: stargateNFTAbi,
            address: stargateNFTContractAddress,
            functionName: "tokenURI",
            args: [BigInt(nodeId)],
          })),
        })
        await Promise.all(
          (rawNodeMetadata as string[])?.map(async metadataUri => {
            const metadata = await getIpfsMetadata<StargateNFTMetadata>(metadataUri)
            nodeMetadata.push(metadata)
          }),
        )
      }

      const nodesWithPoints = tokensOverview?.map((node, index) => ({
        ...node,
        endorsementScore: nodePoints[index] ?? BigInt(0),
        metadata: nodeMetadata[index] ?? "",
      }))
      const totalEndorsementScore = usersEndorsementScore ?? BigInt(0)

      const plannedReturn = {
        nodes: nodesWithPoints,
        totalEndorsementScore,
      }
      return plannedReturn
    },
    enabled: !!userAddress,
  })
}
