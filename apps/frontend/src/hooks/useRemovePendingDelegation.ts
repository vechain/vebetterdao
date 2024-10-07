import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
//import { B3TRDelegation__factory } from "@repo/contracts"
import { isValid } from "@repo/utils/AddressUtils"
import { B3TRGovernor__factory } from "@repo/contracts"

// const DelegationInterface = B3TRDelegation__factory.createInterface()
// const delegationAddress = getConfig().b3trDelegationAddress
// const method = "removePendingDelegation"

// TODO: change to delegation contract
const DelegationInterface = B3TRGovernor__factory.createInterface()
const delegationAddress = getConfig().b3trGovernorAddress
const method = "removePendingDelegation" as any

type UseRemovePendingDelegationProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  delegator: string
}

/**
 * Provides a React hook to remove pending a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRemovePendingDelegation = ({ onSuccess }: UseRemovePendingDelegationProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    ({ delegator }: ClausesParams) => {
      if (!account) throw new Error("Account is required")
      if (!isValid(delegator)) throw new Error("Invalid delegatee address")

      return [
        buildClause({
          to: delegationAddress,
          contractInterface: DelegationInterface,
          method,
          args: [delegator],
          comment: "remove pending delegation",
        }),
      ]
    },
    [account],
  )

  const refetchQueryKeys = useMemo(() => [["delegations"]], [])

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
