import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { NodeManagement__factory } from "@repo/contracts"
import { getUserXNodesQueryKey } from "@/api"

const NodeManagementInterface = NodeManagement__factory.createInterface()
const nodeManagementContractAddress = getConfig().nodeManagementContractAddress
const method = "delegateNode"

type UseDelegateXNodeProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  delegatee: string
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

  const clauseBuilder = useCallback(
    ({ delegatee }: ClausesParams) => {
      if (!account) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")

      return [
        buildClause({
          to: nodeManagementContractAddress,
          contractInterface: NodeManagementInterface,
          method,
          args: [delegatee],
          comment: "delegate xnode",
        }),
      ]
    },
    [account],
  )

  const refetchQueryKeys = useMemo(() => [getUserXNodesQueryKey(account || "")], [account])

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
