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
 * Hook to determine if an XNode has been transferred while attached to a GM NFT, and return the attached GM NFT token ID
 * @returns boolean indicating if the selected GM token is attached to a transferred X-Node and the GM NFT IF attached
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
