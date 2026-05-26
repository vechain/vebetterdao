import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalDevInfoQueryKey } from "../api/contracts/governance/hooks/useProposalDevInfo"
import { getProposalPayeesQueryKey } from "../api/contracts/governance/hooks/useProposalPayees"
import { getProposalStateQueryKey } from "../api/contracts/governance/hooks/useProposalState"

import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()

export type MarkInDevelopmentPayee = {
  account: string
  /** Amount in B3TR wei (already parsed). */
  amount: bigint
}

type Props = {
  proposalId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

type SendArgs = {
  payees: MarkInDevelopmentPayee[]
  devNickname: string
  discussionLink: string
}

/**
 * V11: mark a proposal as InDevelopment and register the developer payees and metadata
 * via the new {markAsInDevelopment} entrypoint. Callable by the proposer or
 * any wallet holding PROPOSAL_STATE_MANAGER_ROLE.
 */
export const useMarkProposalInDevelopment = ({ proposalId, onSuccess, transactionModalCustomUI }: Props) => {
  const clauseBuilder = useCallback(
    ({ payees, devNickname, discussionLink }: SendArgs) => {
      const tuples = payees.map(p => ({ account: p.account, amount: p.amount }))
      return [
        buildClause({
          to: getConfig().b3trGovernorAddress,
          contractInterface: GovernorInterface,
          method: "markAsInDevelopment",
          args: [proposalId, tuples, devNickname, discussionLink],
          comment: "mark proposal in development with developer payees",
        }),
      ]
    },
    [proposalId],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getProposalStateQueryKey(proposalId),
      getAllProposalsStateQueryKey(),
      getProposalPayeesQueryKey(proposalId),
      getProposalDevInfoQueryKey(proposalId),
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
