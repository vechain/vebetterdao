import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
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

import { notFoundImage } from "@/constants"
import { convertUriToUrl } from "@/utils/uri"

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
  ECONOMIC = "Eco Node",
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

export type ActiveEndorsement = {
  appId: string
  points: bigint
  endorsedAtRound: bigint
}

export type UserNode = TokenOverview & {
  endorsementScore: bigint
  metadata: StargateNFTMetadata
  type: NodeType
  activeEndorsements: ActiveEndorsement[]
  availablePoints: bigint
  pointsInCooldown: bigint
  vetAmountStaked: bigint
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
      let nodeActiveEndorsementsArray: { appId: string; points: bigint; endorsedAtRound: bigint }[][] = []
      let nodeAvailablePointsArray: bigint[] = []
      let nodeGmAttachedTokenIdArray: bigint[] = []
      let nodeVetAmountStakedArray: bigint[] = []
      let nodePointsInCooldownArray: bigint[] = []
      if (nodeIds?.length > 0) {
        nodePointsArray = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "getNodeEndorsementScore" as const,
            args: [BigInt(nodeId)],
          })),
        })) as bigint[]

        const rawNodeMetadata = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: stargateNFTAbi,
            address: stargateNFTContractAddress,
            functionName: "tokenURI" as const,
            args: [BigInt(nodeId)],
          })),
        })) as string[]

        nodeMetadataArray = await Promise.all(
          rawNodeMetadata.map(metadataUri => getIpfsMetadata<StargateNFTMetadata>(metadataUri)),
        )

        nodeIsXArray = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: stargateNFTAbi,
            address: stargateNFTContractAddress,
            functionName: "isXToken" as const,
            args: [BigInt(nodeId)],
          })),
        })) as boolean[]

        nodeActiveEndorsementsArray = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "getNodeActiveEndorsements" as const,
            args: [BigInt(nodeId)],
          })),
        })) as { appId: string; points: bigint; endorsedAtRound: bigint }[][]

        nodeAvailablePointsArray = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "getNodeAvailablePoints" as const,
            args: [BigInt(nodeId)],
          })),
        })) as bigint[]

        nodeGmAttachedTokenIdArray = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: galaxyMemberAbi,
            address: galaxyMemberContractAddress,
            functionName: "getIdAttachedToNode" as const,
            args: [BigInt(nodeId)],
          })),
        })) as bigint[]

        const rawGetTokenResults = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: stargateNFTAbi,
            address: stargateNFTContractAddress,
            functionName: "getToken" as const,
            args: [BigInt(nodeId)],
          })),
        })) as { vetAmountStaked?: bigint }[]
        nodeVetAmountStakedArray = rawGetTokenResults.map(t => {
          const raw =
            typeof t === "object" && t !== null && "vetAmountStaked" in t
              ? t.vetAmountStaked
              : Array.isArray(t)
                ? (t as unknown as bigint[])[3]
                : undefined
          return raw !== undefined ? BigInt(raw) : BigInt(0)
        })

        const rawNodePointsInfoArray = (await executeMultipleClausesCall({
          thor,
          calls: nodeIds.map(nodeId => ({
            abi: x2EarnAppsAbi,
            address: x2EarnAppsContractAddress,
            functionName: "getNodePointsInfo" as const,
            args: [BigInt(nodeId)],
          })),
        })) as { lockedPoints?: bigint }[]
        nodePointsInCooldownArray = rawNodePointsInfoArray.map(info => {
          const raw =
            typeof info === "object" && info !== null && "lockedPoints" in info
              ? info.lockedPoints
              : Array.isArray(info)
                ? (info as unknown as bigint[])[3]
                : undefined
          return raw !== undefined ? BigInt(raw) : BigInt(0)
        })
      }

      const nodesWithPoints = tokensOverview?.map((node, index) => {
        const rawMetadata = nodeMetadataArray[index]
        const gmTokenId = nodeGmAttachedTokenIdArray[index] ?? BigInt(0)
        const rawEndorsements = nodeActiveEndorsementsArray[index]
        const activeEndorsements: ActiveEndorsement[] = Array.isArray(rawEndorsements)
          ? rawEndorsements.map((e: any) => ({
              appId: e.appId ?? e[0],
              points: BigInt(e.points ?? e[1] ?? 0),
              endorsedAtRound: BigInt(e.endorsedAtRound ?? e[2] ?? 0),
            }))
          : []

        return {
          ...node,
          type: nodeIsXArray[index] ? NodeType.X : NodeType.ECONOMIC,
          endorsementScore: nodePointsArray[index] ?? BigInt(0),
          activeEndorsements,
          availablePoints: nodeAvailablePointsArray[index] ?? BigInt(0),
          pointsInCooldown: nodePointsInCooldownArray[index] ?? BigInt(0),
          vetAmountStaked: nodeVetAmountStakedArray[index] ?? BigInt(0),
          metadata: {
            name: rawMetadata?.name ?? "",
            description: rawMetadata?.description ?? "",
            attributes: rawMetadata?.attributes ?? [],
            image: rawMetadata?.image ? convertUriToUrl(rawMetadata.image) : notFoundImage,
          },
          currentUserIsManager: compareAddresses(account?.address ?? "", node.manager),
          currentUserIsOwner: compareAddresses(account?.address ?? "", node.owner),
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
