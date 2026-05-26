import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import { getIsPayoutClaimedQueryKey } from "../api/contracts/governance/hooks/useIsPayoutClaimed"
import { getProposalPayeesQueryKey } from "../api/contracts/governance/hooks/useProposalPayees"

import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type Props = {
  proposalId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

type SendArgs = { payeeIndex: number }

/**
 * V11: pull a single payee's payout from Treasury. Permissionless at the contract level.
 */
export const useClaimPayout = ({ proposalId, onSuccess, transactionModalCustomUI }: Props) => {
  const clauseBuilder = useCallback(
    ({ payeeIndex }: SendArgs) => {
      return [
        buildClause({
          to: getConfig().b3trGovernorAddress,
          contractInterface: GovernorInterface,
          method: "claimPayout",
          args: [proposalId, payeeIndex],
          comment: `pay registered developer payee #${payeeIndex} from Treasury`,
        }),
      ]
    },
    [proposalId],
  )

  const refetchQueryKeys = useMemo(
    () => [getProposalPayeesQueryKey(proposalId), getIsPayoutClaimedQueryKey(proposalId, 0)],
    [proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
