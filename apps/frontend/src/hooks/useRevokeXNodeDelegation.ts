import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { NodeManagement__factory, GalaxyMember__factory } from "@repo/contracts"
import { getIsNodeHolderQueryKey, getLevelOfTokenQueryKey, getUserNodesQueryKey, useXNode } from "@/api"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"

const NodeManagementInterface = NodeManagement__factory.createInterface()
const GmInterface = GalaxyMember__factory.createInterface()
const nodeManagementContractAddress = getConfig().nodeManagementContractAddress
const gmContractAddress = getConfig().galaxyMemberContractAddress
const method = "removeNodeDelegation"
const detachMethod = "detachNode"

type UseRevokeXNodeDelegationProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  isAttachedToGM?: boolean
}

/**
 * Provides a React hook to revoke an Node delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 *
 * @param onSuccess - Optional callback to be executed after successful revocation
 * @returns Transaction builder and status information
 */
export const useRevokeXNodeDelegation = ({ onSuccess }: UseRevokeXNodeDelegationProps = {}) => {
  const { account } = useWallet()
  const { xNodeId, attachedGMTokenId } = useXNode()

  const clauseBuilder = useCallback(
    ({ isAttachedToGM }: ClausesParams) => {
      if (!account?.address) throw new Error("Account is required")

      const clauses = []

      if (isAttachedToGM) {
        clauses.push(
          buildClause({
            to: gmContractAddress,
            contractInterface: GmInterface,
            method: detachMethod,
            args: [xNodeId, attachedGMTokenId],
            comment: `detach xnode #${xNodeId} from gm #${attachedGMTokenId}`,
          }),
        )
      }

      clauses.push(
        buildClause({
          to: nodeManagementContractAddress,
          contractInterface: NodeManagementInterface,
          method,
          args: [],
          comment: `revoke xnode #${xNodeId} delegation`,
        }),
      )

      return clauses
    },
    [account, xNodeId, attachedGMTokenId],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getUserNodesQueryKey(account?.address || ""),
      getLevelOfTokenQueryKey(attachedGMTokenId),
      getGetTokenIdAttachedToNodeQueryKey(xNodeId || ""),
      getIsNodeHolderQueryKey(account?.address || ""),
    ],
    [account, attachedGMTokenId, xNodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
