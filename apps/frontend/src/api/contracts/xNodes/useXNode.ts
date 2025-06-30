import { useNodeEndorsedApp, useNodesEndorsementScore, useXAppMetadata } from "../xApps"
import { notFoundImage } from "@/constants"
import { useGetTokenIdAttachedToNode } from "../galaxyMember/hooks/useGetTokenIdAttachedToNode"
import { useIpfsImage, useIpfsMetadatas, useIpfsImageList } from "@/api/ipfs"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { useGetUserNodes } from "./useGetUserNodes"
import { allNodeStrengthLevelToName, NodeStrengthLevelToImage } from "@/constants/XNode"
import { useGMNFTData } from "@/hooks/useGMNFTData"
import { useXNodeCheckCooldown } from "./useXNodeCheckCooldown"
import { useMultipleCalls } from "@/hooks/useMultipleCalls"
import { StargateNFT__factory } from "@repo/contracts/typechain-types"
import { getConfig } from "@repo/config"

const stargateNFTContractAddress = getConfig().stargateNFTContractAddress

// Add these type definitions at the top of the file after imports
interface StargateMetadata {
  name: string
  description: string
  image: string
}

/**
 * Custom hook for retrieving data related to an X-Node.
 *
 * @returns An object containing the following properties:
 * - xNodeName: The name of the X-Node.
 * - xNodeImage: The image URL of the X-Node.
 * - xNodePoints: The points of the X-Node.
 * - isXNodeHolder: A boolean indicating whether the user is an X-Node holder.
 * - attachedGMTokenId: The token ID of the GM NFT attached to the X-Node.
 * */

interface XNodeData {
  isXNodeLoading: boolean
  isXNodeError: boolean
  xNodeError: any
  xNodeId: string | undefined
  xNodeName: string
  nodeType: string
  xNodeImage: string
  xNodeLevel: number
  xNodePoints: number
  endorsedApp: any
  isEndorsingApp: boolean
  xNodeOwner: string | undefined
  isXNodeHolder: boolean
  isXNodeDelegator: boolean
  isXNodeDelegated: boolean
  isXNodeDelegatee: boolean
  delegatee: string | undefined
  attachedGMTokenId: string | undefined
  attachedGMTokenName: string
  isXNodeAttachedToGM: boolean
  isXNodeOnCooldown: boolean
  allNodes: Array<{
    nodeId: string
    nodeLevel: number
    xNodeOwner: string
    isXNodeHolder: boolean
    isXNodeDelegated: boolean
    isXNodeDelegator: boolean
    isXNodeDelegatee: boolean
    delegatee: string
    isLegacyNode: boolean
    name: string
    image: string
  }>
}

export const useXNode = (profile?: string): XNodeData => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const userNodeDetails = useGetUserNodes(profile ?? account?.address ?? "")

  // Store raw node data
  const allNodesWithIsLegacy = userNodeDetails?.data ?? []

  // Separate legacy and Stargate nodes
  const legacyNodes = allNodesWithIsLegacy.filter(node => node.isLegacyNode)
  const stargateNodes = allNodesWithIsLegacy.filter(node => !node.isLegacyNode)

  // Get tokenURI for each Stargate node
  const stargateTokenURICalls = stargateNodes.map(node => ({
    contractInterface: StargateNFT__factory.createInterface(),
    contractAddress: stargateNFTContractAddress,
    method: "tokenURI",
    args: [node.nodeId],
  }))

  const { data: stargateTokenURIs } = useMultipleCalls(stargateTokenURICalls as any)

  // Get metadata from IPFS for each Stargate node
  const stargateMetadatas = useIpfsMetadatas<StargateMetadata>(stargateTokenURIs?.map(uri => uri?.toString() ?? ""))
  const stargateImagesUris = stargateMetadatas?.map(metadata => metadata?.data?.image ?? "")

  // Get images from IPFS for each Stargate node
  const stargateImages = useIpfsImageList(stargateImagesUris)

  // Process legacy nodes with constant metadata
  const legacyNodesWithMetadata = legacyNodes.map(node => ({
    ...node,
    name: allNodeStrengthLevelToName[String(node.nodeLevel)] ?? "Not available",
    image: NodeStrengthLevelToImage[String(node.nodeLevel)] ?? notFoundImage,
  }))

  // Process Stargate nodes with IPFS metadata and images
  const stargateNodesWithMetadata = stargateNodes.map((node, index) => ({
    ...node,
    name: stargateMetadatas?.[index]?.data?.name ?? "Not available",
    image: stargateImages?.[index]?.data?.image ?? notFoundImage,
  }))

  // Combine all nodes
  const allNodes = [...legacyNodesWithMetadata, ...stargateNodesWithMetadata]

  // Process first node for detailed view
  const firstNode = allNodes[0]
  const xNode = firstNode

  const nodeType = Number(xNode?.nodeLevel) >= 4 ? "XNODE" : "ECONOMIC NODE"

  const endorsedAppId = useNodeEndorsedApp(xNode?.nodeId ?? "").data
  const endorsedAppMetadata = useXAppMetadata(endorsedAppId ?? "")
  const { data: logo } = useIpfsImage(endorsedAppMetadata?.data?.logo)
  const endorsedApp = endorsedAppId
    ? {
        id: endorsedAppId,
        ...endorsedAppMetadata.data,
        logo: logo?.image,
      }
    : undefined
  const isEndorsingApp = !!endorsedAppId

  const nodeLevelToEndorsementScore = useNodesEndorsementScore()
  const xNodePoints = Number(nodeLevelToEndorsementScore?.data?.[xNode?.nodeLevel ?? 0] ?? 0)

  const {
    data: attachedGMTokenId,
    isLoading: isLoadingAttachedGMTokenId,
    isError: isErrorAttachedGMTokenId,
    error: errorAttachedGMTokenId,
  } = useGetTokenIdAttachedToNode(xNode?.nodeId ?? "")

  const isXNodeAttachedToGM = !!Number(attachedGMTokenId)

  const isXNodeLoading = userNodeDetails.isLoading || isLoadingAttachedGMTokenId
  const isXNodeError = userNodeDetails.isError || isErrorAttachedGMTokenId
  const xNodeError = userNodeDetails.error || errorAttachedGMTokenId

  const { gmName: attachedGMTokenName } = useGMNFTData(attachedGMTokenId)

  const { data: isXNodeOnCooldown } = useXNodeCheckCooldown(xNode?.nodeId ?? "")

  return {
    isXNodeLoading,
    isXNodeError,
    xNodeError,
    xNodeId: xNode?.nodeId,
    xNodeName: xNode?.name ?? t("Not available"),
    nodeType,
    xNodeImage: xNode?.image ?? notFoundImage,
    xNodeLevel: xNode?.nodeLevel ?? 0,
    xNodePoints,
    endorsedApp,
    isEndorsingApp,
    xNodeOwner: firstNode?.xNodeOwner,
    isXNodeHolder: firstNode?.isXNodeHolder ?? false,
    isXNodeDelegator: firstNode?.isXNodeDelegator ?? false,
    isXNodeDelegated: firstNode?.isXNodeDelegated ?? false,
    isXNodeDelegatee: firstNode?.isXNodeDelegatee ?? false,
    delegatee: firstNode?.delegatee,
    attachedGMTokenId,
    attachedGMTokenName,
    isXNodeAttachedToGM,
    isXNodeOnCooldown,
    allNodes,
  }
}
