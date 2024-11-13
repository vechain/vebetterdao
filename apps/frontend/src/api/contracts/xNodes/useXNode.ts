import { useUserXNodes } from "./useUserXNodes"
import { useNodeEndorsedApp, useNodesEndorsementScore, useXAppMetadata } from "../xApps"
import { notFoundImage } from "@/constants"
import { useGetTokenIdAttachedToNode } from "../galaxyMember/hooks/useGetTokenIdAttachedToNode"
import { useIpfsImage } from "@/api/ipfs"
import { useTranslation } from "react-i18next"

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
  xNodeImage: string
  xNodeLevel: number
  xNodePoints: number
  endorsedApp: any
  isEndorsingApp: boolean
  isXNodeHolder: boolean
  attachedGMTokenId: string | undefined
  isXNodeAttachedToGM: boolean
  isLoadingAttachedGMTokenId: boolean
  isErrorAttachedGMTokenId: boolean
  errorAttachedGMTokenId: any
}

export const useXNode = (): XNodeData => {
  const { t } = useTranslation()
  const xNodes = useUserXNodes()
  // TODO: in the future we will have multiple xNodes
  // For now, we will use the first xNode as wont' consider delegated xnodes
  const firstXNode = xNodes.data?.[0]
  const firstXNodeId = firstXNode?.id
  const isXNodeHolder = !!firstXNode

  // get xNode name, image and level
  const xNodeName = firstXNode?.name ?? t("Not available")
  const xNodeImage = firstXNode?.image ?? notFoundImage
  const xNodeLevel = firstXNode?.level ?? 0

  // get endorsed app for the xnode
  const endorsedAppId = useNodeEndorsedApp(firstXNodeId).data
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

  // get xNode score points
  const nodeLevelToEndorsementScore = useNodesEndorsementScore()
  const xNodePoints = Number(nodeLevelToEndorsementScore?.data?.[firstXNode?.level ?? 0] ?? 0)

  // get attached GM token id
  const {
    data: attachedGMTokenId,
    isLoading: isLoadingAttachedGMTokenId,
    isError: isErrorAttachedGMTokenId,
    error: errorAttachedGMTokenId,
  } = useGetTokenIdAttachedToNode(firstXNodeId)

  const isXNodeLoading =
    xNodes.isLoading ||
    endorsedAppMetadata.isLoading ||
    nodeLevelToEndorsementScore.isLoading ||
    isLoadingAttachedGMTokenId
  const isXNodeError =
    xNodes.isError || endorsedAppMetadata.isError || nodeLevelToEndorsementScore.isError || isErrorAttachedGMTokenId
  const xNodeError =
    xNodes.error || endorsedAppMetadata.error || nodeLevelToEndorsementScore.error || errorAttachedGMTokenId

  const isXNodeAttachedToGM = !!Number(attachedGMTokenId)

  return {
    isXNodeLoading,
    isXNodeError,
    xNodeError,
    xNodeId: firstXNodeId,
    xNodeName,
    xNodeImage,
    xNodeLevel,
    xNodePoints,
    endorsedApp,
    isEndorsingApp,
    isXNodeHolder,
    attachedGMTokenId,
    isXNodeAttachedToGM,
    isLoadingAttachedGMTokenId,
    isErrorAttachedGMTokenId,
    errorAttachedGMTokenId,
  }
}
