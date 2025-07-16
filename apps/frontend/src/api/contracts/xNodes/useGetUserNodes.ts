import { executeMultipleClausesCall, useThor, executeCallClause, useWallet } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { GalaxyMember__factory, StargateNFT__factory, X2EarnApps__factory } from "@repo/contracts/typechain-types"
import { useQuery } from "@tanstack/react-query"

import { getIpfsMetadata } from "@/api/ipfs"
import { allNodeStrengthLevelToName, NodeStrengthLevelToImage } from "@/constants/XNode"
import { notFoundImage } from "@/constants"
import { useNodesEndorsementScore } from "@/api"

const UNENDORSED_APP_ID = "0x0000000000000000000000000000000000000000000000000000000000000000"

const address = getConfig().nodeManagementContractAddress as `0x${string}`
const abi = NodeManagement__factory.abi
const method = "getUserNodes" as const

const stargateNFTAbi = StargateNFT__factory.abi
const stargateNFTContractAddress = getConfig().stargateNFTContractAddress as `0x${string}`

const x2EarnAppsAbi = X2EarnApps__factory.abi
const x2EarnAppsAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`

const galaxyMemberAbi = GalaxyMember__factory.abi
const galaxyMemberAddress = getConfig().galaxyMemberContractAddress as `0x${string}`

interface StargateMetadata {
  name: string
  description: string
  image: string
}

export type NodeType = "XNODE" | "ECONOMIC NODE"

export type UserNode = {
  nodeId: string
  nodeLevel: number
  nodeType: NodeType
  xNodePoints: number
  xNodeOwner: string
  isXNodeHolder: boolean
  isXNodeDelegated: boolean
  isXNodeDelegator: boolean
  isXNodeDelegatee: boolean
  delegatee: string
  isLegacyNode: boolean
  isXNodeOnCooldown: boolean
  image: string
  name: string
  endorsedAppId?: string
  gmTokenIdAttachedToNode?: string
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
 */
export const useGetUserNodes = (user?: string) => {
  const thor = useThor()
  const { account } = useWallet()
  const { data: nodeLevelToEndorsementScore } = useNodesEndorsementScore()
  const userAddress = user ?? account?.address

  return useQuery({
    queryKey: getUserNodesQueryKey(userAddress),
    queryFn: async () => {
      const [userNodes = []] =
        (await executeCallClause({
          thor,
          abi,
          contractAddress: address,
          method,
          args: [(userAddress ?? "0x") as `0x${string}`],
        })) || []

      const [isLegacyCheckCalls, nodesCooldowns, endorsedAppIds, gmsAttachedToNodes] = await Promise.all([
        executeMultipleClausesCall({
          thor,
          calls: userNodes.map(
            node =>
              ({
                abi,
                address,
                functionName: "isLegacyNode",
                args: [node.nodeId],
              }) as const,
          ),
        }),
        executeMultipleClausesCall({
          thor,
          calls: userNodes.map(
            node =>
              ({
                abi: x2EarnAppsAbi,
                address: x2EarnAppsAddress,
                functionName: "checkCooldown",
                args: [node.nodeId],
              }) as const,
          ),
        }),
        executeMultipleClausesCall({
          thor,
          calls: userNodes.map(
            node =>
              ({
                abi: x2EarnAppsAbi,
                address: x2EarnAppsAddress,
                functionName: "nodeToEndorsedApp",
                args: [node.nodeId],
              }) as const,
          ),
        }),
        executeMultipleClausesCall({
          thor,
          calls: userNodes.map(
            node =>
              ({
                abi: galaxyMemberAbi,
                address: galaxyMemberAddress,
                functionName: "getIdAttachedToNode",
                args: [node.nodeId],
              }) as const,
          ),
        }),
      ])

      const userNodesWithEndorsedAppIds = userNodes.map((node, index) => ({
        ...node,
        isXNodeOnCooldown: nodesCooldowns[index] ?? false,
        endorsedAppId: endorsedAppIds[index] === UNENDORSED_APP_ID ? undefined : endorsedAppIds[index],
        gmTokenIdAttachedToNode: gmsAttachedToNodes[index] ? gmsAttachedToNodes[index].toString() : undefined,
      }))

      const legacyNodes = userNodesWithEndorsedAppIds.filter((_node, index) => isLegacyCheckCalls[index])
      // Process legacy nodes with constant metadata
      const legacyNodesWithMetadata = legacyNodes
        .map(node => ({
          ...node,
          nodeId: node.nodeId.toString(),
          name: allNodeStrengthLevelToName[String(node.nodeLevel)] ?? "Not available",
          image: NodeStrengthLevelToImage[String(node.nodeLevel)] ?? notFoundImage,
          nodeType: Number(node.nodeLevel) >= 4 ? "XNODE" : ("ECONOMIC NODE" as NodeType),
          xNodePoints: Number(nodeLevelToEndorsementScore?.[node.nodeLevel] ?? 0),
          isLegacyNode: true,
        }))
        .sort((a, b) => Number(a.nodeLevel) - Number(b.nodeLevel))

      const stargateNodes = userNodesWithEndorsedAppIds.filter((_node, index) => !isLegacyCheckCalls[index])
      const stargateTokenURIs = await executeMultipleClausesCall({
        thor,
        calls: stargateNodes.map(
          node =>
            ({
              abi: stargateNFTAbi,
              address: stargateNFTContractAddress,
              functionName: "tokenURI",
              args: [node.nodeId],
            }) as const,
        ),
      })
      const stargateTokenURIList = stargateTokenURIs?.map(uri => uri?.toString() ?? "") ?? []
      const stargateMetadatas = await Promise.all(
        stargateTokenURIList.map(uri => getIpfsMetadata<StargateMetadata>(uri, false)),
      )
      const stargateNodesWithMetadata = stargateNodes
        .map((node, index) => ({
          ...node,
          nodeId: node.nodeId.toString(),
          nodeType: (Number(node.nodeLevel) >= 4 ? "XNODE" : "ECONOMIC NODE") as NodeType,
          xNodePoints: Number(nodeLevelToEndorsementScore?.[node.nodeLevel] ?? 0),
          name: stargateMetadatas?.[index]?.name ?? "Not available",
          image: stargateMetadatas?.[index]?.image
            ? `https://ipfs.io/ipfs/${stargateMetadatas?.[index]?.image.replace("ipfs://", "")}`
            : notFoundImage,
          isLegacyNode: false,
        }))
        .sort((a, b) => Number(a.nodeLevel) - Number(b.nodeLevel))

      return {
        allNodes: [...legacyNodesWithMetadata, ...stargateNodesWithMetadata],
        legacyNodes: legacyNodesWithMetadata,
        stargateNodes: stargateNodesWithMetadata,
      }
    },
  })
}

// For backward compatibility (if needed)
export const useGetUserNode = useGetUserNodes
