import { useNodeEndorsedApp, useNodesEndorsementScore, useXAppMetadata } from "../xApps"
import { notFoundImage } from "@/constants"
import { useGetTokenIdAttachedToNode } from "../galaxyMember/hooks/useGetTokenIdAttachedToNode"
import { useIpfsImage, useIpfsMetadatas, useIpfsImageList } from "@/api/ipfs"
import { useTranslation } from "react-i18next"
import { executeMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"
import { useGetUserNodes } from "./useGetUserNodes"
import { allNodeStrengthLevelToName, NodeStrengthLevelToImage } from "@/constants/XNode"
import { useGMNFTData } from "@/hooks/useGMNFTData"
import { useXNodeCheckCooldown } from "./useXNodeCheckCooldown"
import { StargateNFT__factory } from "@repo/contracts/typechain-types"
import { getConfig } from "@repo/config"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

const stargateNFTAbi = StargateNFT__factory.abi
const stargateNFTContractAddress = getConfig().stargateNFTContractAddress as `0x${string}`

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
  attachedGMTokenLevel: string | undefined
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
  const thor = useThor()
  const { account } = useWallet()
  const userNodeDetails = useGetUserNodes(profile ?? account?.address ?? "")

  // Store raw node data
  const allNodesWithIsLegacy = useMemo(() => userNodeDetails?.data ?? [], [userNodeDetails?.data])

  // Separate legacy and Stargate nodes
  const legacyNodes = useMemo(() => allNodesWithIsLegacy.filter(node => node.isLegacyNode), [allNodesWithIsLegacy])
  const stargateNodes = useMemo(() => allNodesWithIsLegacy.filter(node => !node.isLegacyNode), [allNodesWithIsLegacy])

  const { data: stargateTokenURIs } = useQuery({
    queryKey: ["user-x-nodes-stargate-token-uris", stargateNodes.map(node => node.nodeId)],
    queryFn: () =>
      executeMultipleClausesCall({
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
      }),
  })

  // Get metadata from IPFS for each Stargate node
  const stargateTokenURIList = useMemo(
    () => stargateTokenURIs?.map(uri => uri?.toString() ?? "") ?? [],
    [stargateTokenURIs],
  )
  const stargateMetadatas = useIpfsMetadatas<StargateMetadata>(stargateTokenURIList, false)

  // Only extract image URIs when metadata is available
  const stargateImagesUris = useMemo(
    () => stargateMetadatas?.map(metadata => metadata?.data?.image ?? "") ?? [],
    [stargateMetadatas],
  )

  // Get images from IPFS for each Stargate node
  const stargateImages = useIpfsImageList(stargateImagesUris)

  // Process legacy nodes with constant metadata
  const legacyNodesWithMetadata = useMemo(
    () =>
      legacyNodes.map(node => ({
        ...node,
        name: allNodeStrengthLevelToName[String(node.nodeLevel)] ?? "Not available",
        image: NodeStrengthLevelToImage[String(node.nodeLevel)] ?? notFoundImage,
      })),
    [legacyNodes],
  )

  // Process Stargate nodes with IPFS metadata and images
  const stargateNodesWithMetadata = useMemo(
    () =>
      stargateNodes.map((node, index) => ({
        ...node,
        name: stargateMetadatas?.[index]?.data?.name ?? "Not available",
        image: stargateImages?.[index]?.data?.image ?? notFoundImage,
      })),
    [stargateNodes, stargateMetadatas, stargateImages],
  )

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

  const { gmName: attachedGMTokenName, gmLevel } = useGMNFTData(attachedGMTokenId)

  const { data: isXNodeOnCooldown = false } = useXNodeCheckCooldown(xNode?.nodeId ?? "")

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
    attachedGMTokenLevel: gmLevel,
    isXNodeAttachedToGM,
    isXNodeOnCooldown,
    allNodes,
  }
}
