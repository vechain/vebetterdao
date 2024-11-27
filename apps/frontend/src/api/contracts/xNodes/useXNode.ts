import { useNodeEndorsedApp, useNodesEndorsementScore, useXAppMetadata } from "../xApps"
import { notFoundImage } from "@/constants"
import { useGetTokenIdAttachedToNode } from "../galaxyMember/hooks/useGetTokenIdAttachedToNode"
import { useIpfsImage } from "@/api/ipfs"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/dapp-kit-react"
import { useGetUserNode } from "./useGetUserNode"
import { allNodeStrengthLevelToName, NodeStrengthLevelToImage } from "@/constants/XNode"

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
  xNodeOwner: string | undefined
  isXNodeHolder: boolean
  isXNodeDelegator: boolean
  isXNodeDelegated: boolean
  isXNodeDelegatee: boolean
  delegatee: string | undefined
  attachedGMTokenId: string | undefined
  isXNodeAttachedToGM: boolean
  isLoadingAttachedGMTokenId: boolean
  isErrorAttachedGMTokenId: boolean
  errorAttachedGMTokenId: any
}

export const useXNode = (): XNodeData => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const userNodeDetails = useGetUserNode(account ?? "")
  // const xNodes = useUserXNodes()
  // TODO: in the future we will have multiple xNodes
  // For now, we will use the first xNode as wont' consider delegated xnodes
  const xNode = {
    id: userNodeDetails?.data?.nodeId,
    level: Number(userNodeDetails?.data?.nodeLevel),
    image: NodeStrengthLevelToImage[Number(userNodeDetails?.data?.nodeLevel)] as string,
    name: allNodeStrengthLevelToName[Number(userNodeDetails?.data?.nodeLevel)] as string,
  }

  // get xNode name, image and level
  const xNodeName = xNode?.name ?? t("Not available")
  const xNodeImage = xNode?.image ?? notFoundImage
  const xNodeLevel = xNode?.level ?? 0

  // get endorsed app for the xnode
  const endorsedAppId = useNodeEndorsedApp(xNode?.id ?? "").data
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
  const xNodePoints = Number(nodeLevelToEndorsementScore?.data?.[xNode?.level ?? 0] ?? 0)

  // get attached GM token id
  const {
    data: attachedGMTokenId,
    isLoading: isLoadingAttachedGMTokenId,
    isError: isErrorAttachedGMTokenId,
    error: errorAttachedGMTokenId,
  } = useGetTokenIdAttachedToNode(xNode?.id ?? "")

  const isXNodeLoading =
    userNodeDetails.isLoading ||
    endorsedAppMetadata.isLoading ||
    nodeLevelToEndorsementScore.isLoading ||
    isLoadingAttachedGMTokenId
  const isXNodeError =
    userNodeDetails.isError ||
    endorsedAppMetadata.isError ||
    nodeLevelToEndorsementScore.isError ||
    isErrorAttachedGMTokenId
  const xNodeError =
    userNodeDetails.error || endorsedAppMetadata.error || nodeLevelToEndorsementScore.error || errorAttachedGMTokenId

  const isXNodeAttachedToGM = !!Number(attachedGMTokenId)

  return {
    isXNodeLoading,
    isXNodeError,
    xNodeError,
    xNodeId: xNode?.id,
    xNodeName,
    xNodeImage,
    xNodeLevel,
    xNodePoints,
    endorsedApp,
    isEndorsingApp,
    isXNodeHolder: userNodeDetails?.data?.isXNodeHolder ?? false,
    isXNodeDelegator: userNodeDetails?.data?.isXNodeDelegator ?? false,
    attachedGMTokenId,
    isXNodeAttachedToGM,
    isLoadingAttachedGMTokenId,
    isErrorAttachedGMTokenId,
    errorAttachedGMTokenId,
    delegatee: userNodeDetails?.data?.delegatee,
    xNodeOwner: userNodeDetails?.data?.xNodeOwner,
    isXNodeDelegated: userNodeDetails?.data?.isXNodeDelegated ?? false,
    isXNodeDelegatee: userNodeDetails?.data?.isXNodeDelegatee ?? false,
  }
}
