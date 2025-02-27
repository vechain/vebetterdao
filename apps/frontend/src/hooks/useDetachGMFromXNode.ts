import { useCallback, useMemo } from "react"
import { GalaxyMember__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import {
  getLevelOfTokenQueryKey,
  getNFTMetadataUriQueryKey,
  getTokensInfoByOwnerQueryKey,
  useXNode,
  useGetNodeIdAttached,
} from "@/api"
import { buildClause } from "@/utils/buildClause"
import { useWallet } from "@vechain/vechain-kit"
import { getSelectedTokenIdQueryKey } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"
import { getNodeIdAttachedQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetNodeIdAttached"
import { useIsXNodeAttachedWhileTransferred } from "@/hooks"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

type Props = {
  onSuccess?: () => void
}

/**
 * Custom hook for detaching a Galaxy Member (GM) NFT from an XNode.
 *
 * This hook prepares and executes a transaction to detach an XNode from a GM NFT.
 *
 * @param {Props} props - The properties for the hook.
 * @param {Function} [props.onSuccess] - Optional callback function to be called on successful transaction.
 * @returns {Object} An object containing the transaction builder and related data.
 *
 * @note Detach the GM either from the connected account xNode,
 * or from the xNode receiver account that have an attached GM
 */
export const useDetachGMFromXNode = ({ onSuccess }: Props) => {
  const { xNodeId, attachedGMTokenId } = useXNode()
  const { attachedGMTokenId: attachedGMTokenIdToExternalNode } = useIsXNodeAttachedWhileTransferred()

  const { data: xNodeHolder } = useGetNodeIdAttached(attachedGMTokenIdToExternalNode ?? "0")
  let xNodeHolderId: string | undefined = xNodeHolder?.toString()

  const clauseBuilder = useCallback(() => {
    if (!xNodeId && !xNodeHolderId) {
      throw new Error("XNode ID is not available")
    }

    if (!attachedGMTokenId && !attachedGMTokenIdToExternalNode) {
      throw new Error("GM NFT ID is not available")
    }

    const nodeIdToUse = xNodeId || xNodeHolderId
    const tokenIdToUse = attachedGMTokenId || attachedGMTokenIdToExternalNode
    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "detachNode",
        args: [nodeIdToUse, tokenIdToUse],
        comment: `Detach XNode ${nodeIdToUse} from GM NFT id ${tokenIdToUse}`,
      }),
    ]
  }, [xNodeId, attachedGMTokenId, xNodeHolderId, attachedGMTokenIdToExternalNode])

  const { account } = useWallet()

  const refetchQueryKeys = useMemo(
    () => [
      getSelectedTokenIdQueryKey(account?.address),
      getLevelOfTokenQueryKey(attachedGMTokenId),
      getGetTokenIdAttachedToNodeQueryKey(xNodeId),
      getNodeIdAttachedQueryKey(attachedGMTokenId),
      getTokensInfoByOwnerQueryKey(account?.address),
      getNFTMetadataUriQueryKey(attachedGMTokenId ?? ""),
    ],
    [account, attachedGMTokenId, xNodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
