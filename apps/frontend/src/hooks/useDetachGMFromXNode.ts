import { useCallback, useMemo } from "react"
import { GalaxyMember__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { getLevelOfTokenQueryKey, getTokensInfoByOwnerQueryKey, useSelectedGmNft, useXNode } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { useWallet } from "@vechain/dapp-kit-react"
import { getSelectedTokenIdQueryKey } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"
import { getNodeIdAttachedQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetNodeIdAttached"

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
 */
export const useDetachGMFromXNode = ({ onSuccess }: Props) => {
  const { xNodeId } = useXNode()
  const { gmId } = useSelectedGmNft()

  const clauseBuilder = useCallback(() => {
    if (!xNodeId) {
      throw new Error("XNode ID is not available")
    }

    if (!gmId) {
      throw new Error("GM NFT ID is not available")
    }

    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "detachNode",
        args: [xNodeId, gmId],
        comment: `Detach XNode ${xNodeId} from GM NFT id ${gmId}`,
      }),
    ]
  }, [xNodeId, gmId])

  const { account } = useWallet()

  const refetchQueryKeys = useMemo(
    () => [
      getSelectedTokenIdQueryKey(account),
      getLevelOfTokenQueryKey(gmId),
      getGetTokenIdAttachedToNodeQueryKey(xNodeId),
      getNodeIdAttachedQueryKey(gmId),
      getTokensInfoByOwnerQueryKey(account),
    ],
    [account, gmId, xNodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
