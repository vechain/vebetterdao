import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { GalaxyMember__factory, NodeManagement__factory } from "@vechain-kit/vebetterdao-contracts"
import { getIsNodeHolderQueryKey, getLevelOfTokenQueryKey, getUserNodesQueryKey, UserNode } from "@/api"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"

const NodeManagementInterface = NodeManagement__factory.createInterface()
const nodeManagementContractAddress = getConfig().nodeManagementContractAddress
const GmInterface = GalaxyMember__factory.createInterface()
const gmContractAddress = getConfig().galaxyMemberContractAddress
const delegateMethod = "delegateNode"
const detachMethod = "detachNode"

type UseDelegateXNodeProps = {
  xNode: UserNode
  onSuccess?: () => void
}

type ClausesParams = {
  delegatee: string
  isAttachedToGM?: boolean
}

/**
 * Provides a React hook to delegate an XNode using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 *
 * @param onSuccess - Optional callback to be executed after successful delegation
 * @returns Transaction builder and status information
 */
export const useDelegateXNode = ({ xNode, onSuccess }: UseDelegateXNodeProps) => {
  const { account } = useWallet()
  const attachedGMTokenId = xNode?.gmTokenIdAttachedToNode

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
    ({ delegatee, isAttachedToGM }: ClausesParams) => {
      if (!nodeData.accountAddress) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")
      if (!nodeData.xNodeId) throw new Error("XNode ID is required")

      const clauses = []

      if (isAttachedToGM && nodeData.attachedGMTokenId) {
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
          method: delegateMethod,
          args: [delegatee, nodeData.xNodeId],
          comment: `Delegate Node #${nodeData.xNodeId} to ${delegatee}`,
        }),
      )

      return clauses
    },
    [nodeData],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getUserNodesQueryKey(nodeData.accountAddress || ""),
      getLevelOfTokenQueryKey(attachedGMTokenId || ""),
      getGetTokenIdAttachedToNodeQueryKey(xNode.nodeId || ""),
      getIsNodeHolderQueryKey(account?.address || ""),
    ],
    [nodeData, account?.address, attachedGMTokenId, xNode.nodeId],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
