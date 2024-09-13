import { useUserXNodes } from "./useUserXNodes"
import { useNodesEndorsedApps, useNodesEndorsementScore } from "../xApps"
import { notFoundImage } from "@/constants"
import { useGetTokenIdAttachedToNode } from "../galaxyMember/hooks/useGetTokenIdAttachedToNode"

/**
 * Custom hook for retrieving data related to an X-Node.
 *
 * @returns An object containing the following properties:
 *  - xNodeName: The name of the X-Node.
 * - xNodeImage: The image URL of the X-Node.
 * - xNodePoints: The points of the X-Node.
 * - isXNodeHolder: A boolean indicating whether the user is an X-Node holder.
 * - attachedGMTokenId: The token ID of the GM NFT attached to the X-Node.
 * */

export const useXNode = () => {
  const xNodes = useUserXNodes()
  const firstXNode = xNodes.data?.[0]
  const firstXNodeId = firstXNode?.id

  const isXNodeHolder = !!firstXNode
  const endorsedApps = useNodesEndorsedApps(firstXNodeId ? [firstXNodeId] : [])
  const nodesEndorsementScore = useNodesEndorsementScore()

  const xNodePoints = endorsedApps.data?.[0]?.endorsedApp
    ? "0"
    : Number(nodesEndorsementScore?.data?.[Number(firstXNodeId)] || "0")
  const xNodeName = firstXNode?.name ?? "N.A."
  const xNodeImage = firstXNode?.image ?? notFoundImage
  const isXNodeLoading = xNodes.isLoading

  const {
    data: attachedGMTokenId,
    isLoading: isLoadingAttachedGMTokenId,
    isError: isErrorAttachedGMTokenId,
    error: errorAttachedGMTokenId,
  } = useGetTokenIdAttachedToNode(firstXNodeId)

  return {
    isXNodeLoading,
    xNodeId: firstXNodeId,
    xNodeName,
    xNodeImage,
    xNodePoints,
    isXNodeHolder,
    attachedGMTokenId,
    isLoadingAttachedGMTokenId,
    isErrorAttachedGMTokenId,
    errorAttachedGMTokenId,
  }
}
