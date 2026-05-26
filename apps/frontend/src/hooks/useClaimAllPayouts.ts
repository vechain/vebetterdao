import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import { getProposalPayeesQueryKey } from "../api/contracts/governance/hooks/useProposalPayees"

import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type Props = {
  proposalId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * V11: pull payouts for every unclaimed registered payee of a Completed proposal in one tx.
 * Permissionless at the contract level; UI surfaces this to admin, proposer, or any wallet
 * in the payees list.
 */
export const useClaimAllPayouts = ({ proposalId, onSuccess, transactionModalCustomUI }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "claimAllPayouts",
        args: [proposalId],
        comment: "pay all registered developer payees from Treasury",
      }),
    ]
  }, [proposalId])

  const refetchQueryKeys = useMemo(() => [getProposalPayeesQueryKey(proposalId)], [proposalId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
