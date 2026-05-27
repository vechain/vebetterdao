import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import {
  getIsProposalPaidQueryKey,
  getIsProposalPaidQueryKeyPrefix,
} from "../api/contracts/governance/hooks/useIsProposalPaid"

import { useBuildTransaction } from "./useBuildTransaction"
import { getEventsKey } from "./useEvents"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type Props = {
  proposalId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * V11: pull the full implementation cost from Treasury to the single registered payee.
 * Permissionless at the contract level; UI surfaces this to admin, proposer, or the payee.
 */
export const useClaimPayout = ({ proposalId, onSuccess, transactionModalCustomUI }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "claimPayout",
        args: [proposalId],
        comment: "pull implementation cost from Treasury to the registered payee",
      }),
    ]
  }, [proposalId])

  const refetchQueryKeys = useMemo(
    () => [
      getIsProposalPaidQueryKey(proposalId),
      // Prefix invalidation in case multiple proposals are cached.
      getIsProposalPaidQueryKeyPrefix(),
      // Event stream for the Paid timeline step.
      getEventsKey({ eventName: "ProposalPayoutClaimed" }),
    ],
    [proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
