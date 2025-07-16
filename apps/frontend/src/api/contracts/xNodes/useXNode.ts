import { useNodesEndorsedApps, useNodesEndorsementScore, XAppWithMetadata } from "../xApps"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { useGetUserNodes } from "./useGetUserNodes"
import { GmNFTData, useGmNFTsAttachedToNode } from "@/hooks/useGmNFTsAttachedToNode"
import { useXNodesCheckCooldown } from "./useXNodeCheckCooldown"

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

export interface XNodeData {
  nodeId: string
  name: string
  image: string
  nodeLevel: number
  xNodeOwner: string
  isXNodeHolder: boolean
  isXNodeDelegated: boolean
  isXNodeDelegator: boolean
  isXNodeDelegatee: boolean
  delegatee: string
  gmNFT: GmNFTData | undefined
  nodeType: "XNODE" | "ECONOMIC NODE"
  xNodePoints: number
  endorsedApp: XAppWithMetadata
  isEndorsingApp: boolean
  isXNodeOnCooldown: boolean
}

export const useXNode = (profile?: string) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data, isLoading, isError, error } = useGetUserNodes(profile ?? account?.address ?? "")

  const allNodes = [...(data?.legacyNodes ?? []), ...(data?.stargateNodes ?? [])]

  const nodeLevelToEndorsementScore = useNodesEndorsementScore()

  const {
    data: endorsedApps = [],
    isLoading: isLoadingEndorsedApps,
    isError: isErrorEndorsedApps,
    error: errorEndorsedApps,
  } = useNodesEndorsedApps(allNodes.map(node => node.nodeId))
  const {
    data: gmNFTsAttachedToNode = [],
    isLoading: isLoadingGmNFTsAttachedToNode,
    isError: isErrorGmNFTsAttachedToNode,
    error: errorGmNFTsAttachedToNode,
  } = useGmNFTsAttachedToNode(allNodes.map(node => node.nodeId))

  const { data: xNodesCoolDowns } = useXNodesCheckCooldown(allNodes.map(node => node.nodeId))

  const nodes = allNodes.map((node, nodeIndex) => {
    const gmNFT = gmNFTsAttachedToNode.find(gmNFT => gmNFT.tokenId === node.nodeId)
    return {
      ...node,
      name: node.name ?? t("Not available"),
      gmNFT,
      nodeType: Number(node.nodeLevel) >= 4 ? "XNODE" : "ECONOMIC NODE",
      xNodePoints: Number(nodeLevelToEndorsementScore?.data?.[node.nodeLevel] ?? 0),
      endorsedApp: endorsedApps.find(app => app.id === node.nodeId)?.endorsedApp,
      isEndorsingApp: endorsedApps.some(app => app.id === node.nodeId),
      isXNodeOnCooldown: xNodesCoolDowns?.[nodeIndex] ?? false,
    } as XNodeData
  })

  return {
    isLoading: isLoading || isLoadingEndorsedApps || isLoadingGmNFTsAttachedToNode,
    isError: isError || isErrorEndorsedApps || isErrorGmNFTsAttachedToNode,
    error: error || errorEndorsedApps || errorGmNFTsAttachedToNode,
    nodes,
  }
}
