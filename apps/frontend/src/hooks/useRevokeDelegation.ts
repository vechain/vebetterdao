import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
//import { B3TRDelegation__factory } from "@repo/contracts"
import { B3TRGovernor__factory } from "@repo/contracts"

// const DelegationInterface = B3TRDelegation__factory.createInterface()
// const delegationAddress = getConfig().b3trDelegationAddress
// const method = "revokeDelegation"

// TODO: change to delegation contract
const DelegationInterface = B3TRGovernor__factory.createInterface()
const delegationAddress = getConfig().b3trGovernorAddress
const method = "revokeDelegation" as any

type UseRevokeDelegationProps = {
  onSuccess?: () => void
}

/**
 * Provides a React hook to revoke a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRevokeDelegation = ({ onSuccess }: UseRevokeDelegationProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    if (!account) throw new Error("Account is required")

    return [
      buildClause({
        to: delegationAddress,
        contractInterface: DelegationInterface,
        method,
        args: [],
        comment: "revoke delegation",
      }),
    ]
  }, [account])

  const refetchQueryKeys = useMemo(() => [["delegations"]], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
