import { useCallback, useMemo } from "react"
import { GalaxyMember__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { getLevelOfTokenQueryKey, getNFTMetadataUriQueryKey, getUserGMsQueryKey, getUserNodesQueryKey } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { getSelectedTokenIdQueryKey } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
import { useWallet } from "@vechain/vechain-kit"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"
import {
  getNodeIdAttachedQueryKey,
  useGetNodeIdAttached,
} from "@/api/contracts/galaxyMember/hooks/useGetNodeIdAttached"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

type Props = {
  gmId: string
  xNodeId: string
  onSuccess?: () => void
}

/**
 * Custom hook for attaching a Galaxy Member (GM) NFT to an XNode.
 *
 * This hook prepares and executes a transaction to attach an XNode to a GM NFT,
 * potentially upgrading the NFT based on the XNode's level.
 *
 * @param {Props} props - The properties for the hook.
 * @param {Function} [props.onSuccess] - Optional callback function to be called on successful transaction.
 * @returns {Object} An object containing the transaction builder and related data.
 */
export const useAttachGMToXNode = ({ gmId, xNodeId, onSuccess }: Props) => {
  const { data: currentNodeId } = useGetNodeIdAttached(gmId)

  const clauseBuilder = useCallback(() => {
    if (!xNodeId) {
      throw new Error("XNode ID is not available")
    }
    if (!gmId) {
      throw new Error("GM NFT ID is not available")
    }

    const clauses = []

    const currentNodeIdAttachedToGM = currentNodeId && currentNodeId !== "0"
    // If GM is attached to another node, add detach clause first
    if (currentNodeIdAttachedToGM) {
      clauses.push(
        buildClause({
          to: getConfig().galaxyMemberContractAddress,
          contractInterface: GalaxyMemberInterface,
          method: "detachNode",
          args: [currentNodeId, gmId],
          comment: `Detach GM NFT id ${gmId} from XNode ${currentNodeId}`,
        }),
      )
    }

    // Add attach clause
    clauses.push(
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "attachNode",
        args: [xNodeId, gmId],
        comment: `Attach XNode ${xNodeId} to GM NFT id ${gmId}`,
      }),
    )

    return clauses
  }, [xNodeId, gmId, currentNodeId])

  const { account } = useWallet()

  const refetchQueryKeys = useMemo(
    () => [
      getSelectedTokenIdQueryKey(account?.address ?? ""),
      getLevelOfTokenQueryKey(gmId),
      getGetTokenIdAttachedToNodeQueryKey(xNodeId),
      getNodeIdAttachedQueryKey(gmId),
      getNFTMetadataUriQueryKey(gmId),
      getUserNodesQueryKey(account?.address ?? ""),
      getUserGMsQueryKey(account?.address ?? ""),
    ],
    [account?.address, gmId, xNodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
