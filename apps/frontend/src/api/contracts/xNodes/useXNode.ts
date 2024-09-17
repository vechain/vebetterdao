import { useUserXNodes } from "./useUserXNodes"
import { useNodesEndorsedApps, useNodesEndorsementScore } from "../xApps"
import { notFoundImage } from "@/constants"

/**
 * Custom hook for retrieving data related to an X-Node.
 *
 * @returns An object containing the following properties:
 *  - xNodeName: The name of the X-Node.
 * - xNodeImage: The image URL of the X-Node.
 * - xNodePoints: The points of the X-Node.
 * - isXNodeHolder: A boolean indicating whether the user is an X-Node holder.
 * - isXNodeAttachedToGM: A boolean indicating whether the X-Node is attached to the GM NFT.
 * */
export const useXNode = () => {
  const xNodes = useUserXNodes()
  const firstXNode = xNodes.data?.[0]
  const firstXNodeId = firstXNode?.id
  console.log("firstXNodeId", firstXNodeId)

  const isXNodeHolder = !!firstXNode
  const endorsedApps = useNodesEndorsedApps(firstXNodeId ? [firstXNodeId] : [])
  console.log("endorsedApps", endorsedApps)
  const nodesEndorsementScore = useNodesEndorsementScore()
  console.log("nodesEndorsementScore", nodesEndorsementScore)

  const xNodePoints = endorsedApps.data?.[0]?.endorsedApp
    ? "0"
    : Number(nodesEndorsementScore?.data?.[Number(firstXNodeId)] || "0")
  console.log("xNodePoints", xNodePoints)
  const xNodeName = firstXNode?.name ?? "N.A."
  const xNodeImage = firstXNode?.image ?? notFoundImage
  const isXNodeLoading = xNodes.isLoading

  // TODO: map missing data
  const isXNodeAttachedToGM = isXNodeHolder && true

  return {
    isXNodeLoading,
    xNodeName,
    xNodeImage,
    xNodePoints,
    isXNodeHolder,
    isXNodeAttachedToGM,
  }
}
