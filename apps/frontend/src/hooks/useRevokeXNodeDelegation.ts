import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { NodeManagement__factory, GalaxyMember__factory } from "@repo/contracts"
import {
  getIsXNodeDelegatedQueryKey,
  getLevelOfTokenQueryKey,
  getNodeDelegationDetailsQueryKey,
  getUserNodeQueryKey,
  getUserXNodesQueryKey,
  useSelectedGmNft,
  useXNode,
} from "@/api"

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
 * Provides a React hook to revoke an XNode delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 *
 * @param onSuccess - Optional callback to be executed after successful revocation
 * @returns Transaction builder and status information
 */
export const useRevokeXNodeDelegation = ({ onSuccess }: UseRevokeXNodeDelegationProps = {}) => {
  const { account } = useWallet()
  const { xNodeId } = useXNode()
  const { gmId } = useSelectedGmNft()

  const clauseBuilder = useCallback(
    ({ isAttachedToGM }: ClausesParams) => {
      if (!account) throw new Error("Account is required")

      const clauses = []

      if (isAttachedToGM) {
        clauses.push(
          buildClause({
            to: gmContractAddress,
            contractInterface: GmInterface,
            method: detachMethod,
            args: [],
            comment: "detach xnode from gm",
          }),
        )
      }

      clauses.push(
        buildClause({
          to: nodeManagementContractAddress,
          contractInterface: NodeManagementInterface,
          method,
          args: [],
          comment: "revoke xnode delegation",
        }),
      )

      return clauses
    },
    [account],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getUserXNodesQueryKey(account || ""),
      getUserNodeQueryKey(account || ""),
      getLevelOfTokenQueryKey(gmId),
      getNodeDelegationDetailsQueryKey(xNodeId),
      getIsXNodeDelegatedQueryKey(xNodeId),
    ],
    [account, gmId, xNodeId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
