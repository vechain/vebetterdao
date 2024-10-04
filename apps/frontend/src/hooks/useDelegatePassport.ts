import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
//import { B3TRDelegation__factory } from "@repo/contracts"
import { isValid } from "@repo/utils/AddressUtils"
import { B3TRGovernor__factory } from "@repo/contracts"
import { buildClause } from "@/utils/buildClause"

// const DelegationInterface = B3TRDelegation__factory.createInterface()
// const delegationAddress = getConfig().b3trDelegationAddress
// const method = "delegatePassport"

// TODO: change to delegation contract
const DelegationInterface = B3TRGovernor__factory.createInterface()
const delegationAddress = getConfig().b3trGovernorAddress
const method = "delegatePassport" as any

type UseDelegatePassportProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  delegatee: string
}

/**
 * Provides a React hook to propose a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useDelegatePassport = ({ onSuccess }: UseDelegatePassportProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    ({ delegatee }: ClausesParams) => {
      if (!account) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")

      return [
        buildClause({
          to: delegationAddress,
          contractInterface: DelegationInterface,
          method,
          args: [delegatee],
          comment: "propose delegation",
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
