import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { GalaxyMember__factory, NodeManagement__factory } from "@repo/contracts"
import { getLevelOfTokenQueryKey, getUserNodeQueryKey, getUserXNodesQueryKey, useSelectedGmNft } from "@/api"

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
  const { gmId } = useSelectedGmNft()

  const clauseBuilder = useCallback(
    ({ delegatee, isAttachedToGM }: ClausesParams) => {
      if (!account) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")

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
          method: delegateMethod,
          args: [delegatee],
          comment: "delegate xnode",
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
      getLevelOfTokenQueryKey(gmId || ""),
    ],
    [account, gmId],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
