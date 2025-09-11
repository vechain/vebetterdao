import { useCallback, useMemo } from "react"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import {
  getLevelOfTokenQueryKey,
  getNFTMetadataUriQueryKey,
  getUserGMsQueryKey,
  getUserNodesQueryKey,
  useGetUserGMs,
} from "@/api"
import { buildClause } from "@/utils/buildClause"
import { useWallet } from "@vechain/vechain-kit"
import { getSelectedTokenIdQueryKey } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"
import { getNodeIdAttachedQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetNodeIdAttached"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

type Props = {
  xNodeId: string
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
export const useDetachGMFromXNode = ({ xNodeId, onSuccess }: Props) => {
  const { data: userGms } = useGetUserGMs()
  const attachedGMTokenId = userGms?.find(gm => gm.nodeIdAttached === xNodeId)?.tokenId

  const clauseBuilder = useCallback(() => {
    if (!xNodeId) {
      throw new Error("XNode ID is not available")
    }

    if (!attachedGMTokenId) {
      throw new Error("GM NFT ID is not available")
    }

    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "detachNode",
        args: [xNodeId, attachedGMTokenId],
        comment: `Detach XNode ${xNodeId} from GM NFT id ${attachedGMTokenId}`,
      }),
    ]
  }, [xNodeId, attachedGMTokenId])

  const { account } = useWallet()

  const refetchQueryKeys = useMemo(
    () => [
      getSelectedTokenIdQueryKey(account?.address),
      getLevelOfTokenQueryKey(attachedGMTokenId),
      getGetTokenIdAttachedToNodeQueryKey(xNodeId),
      getNodeIdAttachedQueryKey(attachedGMTokenId),
      getNFTMetadataUriQueryKey(attachedGMTokenId ?? ""),
      getUserNodesQueryKey(account?.address ?? ""),
      getUserGMsQueryKey(account?.address ?? ""),
    ],
    [account, attachedGMTokenId, xNodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
