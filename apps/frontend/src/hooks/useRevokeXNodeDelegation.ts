import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { NodeManagement__factory, GalaxyMember__factory } from "@vechain/vebetterdao-contracts"
import { getIsNodeHolderQueryKey, getLevelOfTokenQueryKey, getUserNodesQueryKey, UserNode } from "@/api"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"

const NodeManagementInterface = NodeManagement__factory.createInterface()
const GmInterface = GalaxyMember__factory.createInterface()
const nodeManagementContractAddress = getConfig().nodeManagementContractAddress
const gmContractAddress = getConfig().galaxyMemberContractAddress
const method = "removeNodeDelegation"
const detachMethod = "detachNode"

type UseRevokeXNodeDelegationProps = {
  xNode: UserNode
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
export const useRevokeXNodeDelegation = ({ xNode, onSuccess }: UseRevokeXNodeDelegationProps) => {
  const { account } = useWallet()

  // Memoize the node data to prevent changes during transaction
  const nodeData = useMemo(
    () => ({
      xNodeId: xNode.nodeId,
      attachedGMTokenId: xNode.gmTokenIdAttachedToNode,
      accountAddress: account?.address,
    }),
    [account?.address, xNode.gmTokenIdAttachedToNode, xNode.nodeId],
  )

  const clauseBuilder = useCallback(
    ({ isAttachedToGM }: ClausesParams) => {
      if (!nodeData.accountAddress) throw new Error("Account is required")

      const clauses = []

      if (isAttachedToGM) {
        clauses.push(
          buildClause({
            to: gmContractAddress,
            contractInterface: GmInterface,
            method: detachMethod,
            args: [nodeData.xNodeId, nodeData.attachedGMTokenId],
            comment: `detach xnode #${nodeData.xNodeId} from gm #${nodeData.attachedGMTokenId}`,
          }),
        )
      }

      clauses.push(
        buildClause({
          to: nodeManagementContractAddress,
          contractInterface: NodeManagementInterface,
          method,
          args: [nodeData.xNodeId],
          comment: `revoke xnode #${nodeData.xNodeId} delegation`,
        }),
      )

      return clauses
    },
    [nodeData],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getUserNodesQueryKey(nodeData.accountAddress || ""),
      getLevelOfTokenQueryKey(nodeData.attachedGMTokenId),
      getGetTokenIdAttachedToNodeQueryKey(nodeData.xNodeId || ""),
      getIsNodeHolderQueryKey(nodeData.accountAddress || ""),
    ],
    [nodeData],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
