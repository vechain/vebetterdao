import { useXNode } from "@/api"
import {
  useGetNodeIdAttached,
  useGetTokenIdAttachedToNode,
  useSelectedTokenId,
} from "@/api/contracts/galaxyMember/hooks"
import { useMemo } from "react"

export type Props = {
  isXNodeAttachedWhileTransferred: boolean
  attachedGMTokenId: string | undefined
}

/**
 * Hook to determine if a sender transferred an XNode while attached to his own GM NFT
 *
 * Steps:
 * 1. Fetching the node of the user (he should not have one as the sender)
 * 2. Fetching the XNode that is attached to the selected GM NFT (if there is one)
 * 3. Checking that user no longer has the node, but the GM, that he owns, is attached to it
 * 4. If so, the GM NFT is attached while the XNode has been transferred, indicating
 *    a potential edge case that needs to be handled
 *
 * @returns {Props} Object containing:
 *   - isXNodeAttachedWhileTransferred: boolean indicating if the selected GM token is attached to a transferred X-Node
 *   - attachedGMTokenId: the GM NFT ID if attached, undefined otherwise
 */

export const useIsXNodeAttachedWhileTransferred = (): Props => {
  const { xNodeId: userXNodeId, isXNodeDelegated, isXNodeAttachedToGM: xNodeHasGMAttached } = useXNode()
  const { data: selectedTokenId } = useSelectedTokenId()
  const { data: nodeIdAttachedToToken } = useGetNodeIdAttached(selectedTokenId)
  const { data: gmAttachedToNode } = useGetTokenIdAttachedToNode(nodeIdAttachedToToken)

  return useMemo(() => {
    if (!isXNodeDelegated && (!userXNodeId || (nodeIdAttachedToToken !== userXNodeId && xNodeHasGMAttached))) {
      return {
        isXNodeAttachedWhileTransferred: gmAttachedToNode === selectedTokenId && gmAttachedToNode !== "0",
        attachedGMTokenId: gmAttachedToNode?.toString() ?? "0",
      }
    }
    return { isXNodeAttachedWhileTransferred: false, attachedGMTokenId: "" }
  }, [nodeIdAttachedToToken, userXNodeId, isXNodeDelegated, xNodeHasGMAttached, gmAttachedToNode, selectedTokenId])
}
