import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { GalaxyMember__factory, NodeManagement__factory } from "@repo/contracts"
import { getIsNodeHolderQueryKey, getLevelOfTokenQueryKey, getUserNodesQueryKey, useXNode } from "@/api"
import { getGetTokenIdAttachedToNodeQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokenIdAttachedToNode"

const NodeManagementInterface = NodeManagement__factory.createInterface()
const nodeManagementContractAddress = getConfig().nodeManagementContractAddress
const GmInterface = GalaxyMember__factory.createInterface()
const gmContractAddress = getConfig().galaxyMemberContractAddress
const delegateMethod = "delegateNode"
const detachMethod = "detachNode"

type UseDelegateXNodeProps = {
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
export const useDelegateXNode = ({ onSuccess }: UseDelegateXNodeProps = {}) => {
  const { account } = useWallet()
  const { xNodeId, attachedGMTokenId } = useXNode()

  const clauseBuilder = useCallback(
    ({ delegatee, isAttachedToGM }: ClausesParams) => {
      if (!account?.address) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")

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
          method: delegateMethod,
          args: [delegatee],
          comment: `Delegate Node #${xNodeId} to ${delegatee}`,
        }),
      )

      return clauses
    },
    [account, xNodeId, attachedGMTokenId],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getUserNodesQueryKey(account?.address || ""),
      getLevelOfTokenQueryKey(attachedGMTokenId || ""),
      getGetTokenIdAttachedToNodeQueryKey(xNodeId || ""),
      getIsNodeHolderQueryKey(account?.address || ""),
    ],
    [account, attachedGMTokenId, xNodeId],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
