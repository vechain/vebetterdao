import { useCallback, useMemo } from "react"
import { GalaxyMember__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { useSelectedGmNft, useXNode } from "@/api"
import { buildClause } from "@/utils/buildClause"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

type Props = {
  onSuccess?: () => void
}

/**
 * Custom hook for attaching a Galaxy Member (GM) NFT to an XNode.
 *
 * This hook prepares and executes a transaction to attach an XNode to a GM NFT,
 * potentially upgrading the NFT based on the XNode's level.
 *
 * @param {Function} [props.onSuccess] - Optional callback function to be called on successful transaction.
 */
export const useAttachGMToXNode = ({ onSuccess }: Props) => {
  const { xNodeId } = useXNode()
  const { gmLevel } = useSelectedGmNft()

  const clauseBuilder = useCallback(() => {
    if (!xNodeId) {
      throw new Error("XNode ID is not available")
    }

    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "attachNode",
        args: [xNodeId, gmLevel],
        comment: `Attach XNode ${xNodeId} to GM NFT level ${gmLevel}`,
      }),
    ]
  }, [xNodeId, gmLevel])

  const refetchQueryKeys = useMemo(() => [], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
