import { getConfig } from "@repo/config"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import {
  type StargateNFT,
  GalaxyMember__factory,
  StargateNFT__factory,
  TokenAuction__factory,
  type X2EarnApps,
  X2EarnApps__factory,
} from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { notFoundImage } from "@/constants"
import { convertUriToUrl } from "@/utils/uri"

import { compareAddresses } from "../../../utils/AddressUtils/AddressUtils"
import { getIpfsMetadata } from "../../ipfs/hooks/useIpfsMetadata"

const x2EarnAppsContractAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`
const stargateNFTContractAddress = getConfig().stargateNFTContractAddress as `0x${string}`
const legacyNodesContractAddress = getConfig().tokenAuctionContractAddress as `0x${string}`
const galaxyMemberContractAddress = getConfig().galaxyMemberContractAddress as `0x${string}`

const x2EarnAppsAbi = X2EarnApps__factory.abi
const stargateNFTAbi = StargateNFT__factory.abi
const legacyNodesAbi = TokenAuction__factory.abi
const galaxyMemberAbi = GalaxyMember__factory.abi

enum NodeType {
  X = "XNode",
  ECONOMIC = "Economic Node",
}

type StargateNFTMetadata = {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string
  }[]
}

type TokenOverviewTuple = Awaited<ReturnType<StargateNFT["tokensOverview"]>>[number]
// executeMultipleClausesCall transforms tuples into objects with named properties
type TokenOverview = {
  id: TokenOverviewTuple[0]
  owner: TokenOverviewTuple[1]
  manager: TokenOverviewTuple[2]
  levelId: number // Converted from bigint to number at runtime
}

export type UserNode = TokenOverview & {
  endorsementScore: bigint
  metadata: StargateNFTMetadata
  type: NodeType
  endorsedAppId: string
  isEndorsingApp: boolean
  isOnCooldown: boolean
  currentUserIsManager: boolean
  currentUserIsOwner: boolean
  gmAttachedTokenId: bigint
  isGmAttached: boolean
}
export type UserNodesInfo = {
  allNodes: UserNode[]
  nodesManagedByUser: UserNode[]
  nodesOwnedByUser: UserNode[]
  totalEndorsementScore: Awaited<ReturnType<X2EarnApps["getUsersEndorsementScore"]>>
  hasLegacyNode: boolean
  legacyNodesCount: bigint
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
export const useGetUserNodes = (user?: string): UseQueryResult<UserNodesInfo> => {
  const thor = useThor()
  const { account } = useWallet()
  const userAddress = user ?? account?.address
  return useQuery({
    queryKey: getUserNodesQueryKey(userAddress),
    queryFn: async () => {
      const [tokensOverview, usersEndorsementScore, legacyNodesCount] = await executeMultipleClausesCall({
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
          {
            abi: legacyNodesAbi,
            address: legacyNodesContractAddress,
            functionName: "balanceOf",
            args: [userAddress as `0x${string}`],
          },
        ],
      })

      const nodeIds = tokensOverview?.map(token => token.id.toString())
      let nodePointsArray: bigint[] = []
      let nodeMetadataArray: StargateNFTMetadata[] = []
      let nodeIsXArray: boolean[] = []
      let nodeToEndorsedAppArray: string[] = []
      let nodeCooldownArray: boolean[] = []
      let nodeGmAttachedTokenIdArray: bigint[] = []
      if (nodeIds?.length > 0) {
        // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
        nodePointsArray = await executeMultipleClausesCall({
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
            nodeMetadataArray.push(metadata)
          }),
        )

        //Get node level info
        // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
        nodeIsXArray = await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: stargateNFTAbi,
            address: stargateNFTContractAddress,
            functionName: "isXToken",
            args: [BigInt(nodeId)],
          })),
        })
        // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
        nodeToEndorsedAppArray = await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "nodeToEndorsedApp",
            args: [BigInt(nodeId)],
          })),
        })
        // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
        nodeCooldownArray = await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "checkCooldown",
            args: [BigInt(nodeId)],
          })),
        })
        // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
        nodeGmAttachedTokenIdArray = await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: galaxyMemberAbi,
            address: galaxyMemberContractAddress,
            functionName: "getIdAttachedToNode",
            args: [BigInt(nodeId)],
          })),
        })
      }

      const nodesWithPoints = tokensOverview?.map((node, index) => {
        const rawMetadata = nodeMetadataArray[index]
        const endorsedAppId = nodeToEndorsedAppArray[index] ?? ethers.ZeroHash
        const gmTokenId = nodeGmAttachedTokenIdArray[index] ?? BigInt(0)

        return {
          // Base node properties (id, owner, manager, levelId)
          ...node,

          // Node classification
          type: nodeIsXArray[index] ? NodeType.X : NodeType.ECONOMIC,

          // Endorsement properties
          endorsementScore: nodePointsArray[index] ?? BigInt(0),
          endorsedAppId,
          isEndorsingApp: !endorsedAppId || endorsedAppId !== ethers.ZeroHash,
          isOnCooldown: nodeCooldownArray?.[index] ?? false,

          // Metadata
          metadata: {
            name: rawMetadata?.name ?? "",
            description: rawMetadata?.description ?? "",
            attributes: rawMetadata?.attributes ?? [],
            image: rawMetadata?.image ? convertUriToUrl(rawMetadata.image) : notFoundImage,
          },

          // User permissions
          currentUserIsManager: compareAddresses(account?.address ?? "", node.manager),
          currentUserIsOwner: compareAddresses(account?.address ?? "", node.owner),

          // Galaxy Member attachment
          gmAttachedTokenId: gmTokenId,
          isGmAttached: gmTokenId > BigInt(0),
        }
      })

      const totalEndorsementScore = usersEndorsementScore ?? BigInt(0)
      const hasLegacyNode = legacyNodesCount ? legacyNodesCount > BigInt(0) : false

      const plannedReturn = {
        allNodes: nodesWithPoints,
        nodesManagedByUser: nodesWithPoints.filter(node => node.currentUserIsManager),
        nodesOwnedByUser: nodesWithPoints.filter(node => node.currentUserIsOwner),
        totalEndorsementScore,
        hasLegacyNode,
        legacyNodesCount: legacyNodesCount ?? BigInt(0),
      }
      return plannedReturn
    },
    enabled: !!userAddress,
  })
}
