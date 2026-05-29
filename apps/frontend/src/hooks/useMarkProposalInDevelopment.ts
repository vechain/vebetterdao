import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalContributorsQueryKey } from "../api/contracts/governance/hooks/useProposalContributors"
import { getProposalDescriptionQueryKey } from "../api/contracts/governance/hooks/useProposalDescription"
import { getProposalImplementationDiscussionQueryKey } from "../api/contracts/governance/hooks/useProposalImplementationDiscussion"
import { getProposalPayeeQueryKey } from "../api/contracts/governance/hooks/useProposalPayee"
import { getProposalStateQueryKey } from "../api/contracts/governance/hooks/useProposalState"

import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type Props = {
  proposalId: string
  onSuccess?: () => void
  onFailure?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

type SendArgs = {
  payee: string
  description: string
  implementationDiscussion: string
  contributors: string[]
}

/**
 * V11: mark a proposal as InDevelopment and register the single payout address,
 * free-text description, implementation-discussion link, and contributor handles.
 * Callable by the proposer or by an admin holding PROPOSAL_STATE_MANAGER_ROLE.
 */
export const useMarkProposalInDevelopment = ({ proposalId, onSuccess, onFailure, transactionModalCustomUI }: Props) => {
  const clauseBuilder = useCallback(
    ({ payee, description, implementationDiscussion, contributors }: SendArgs) => {
      return [
        buildClause({
          to: getConfig().b3trGovernorAddress,
          contractInterface: GovernorInterface,
          method: "markAsInDevelopment",
          args: [proposalId, payee, description, implementationDiscussion, contributors],
          comment: "mark proposal in development and register payee + metadata",
        }),
      ]
    },
    [proposalId],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getProposalStateQueryKey(proposalId),
      getAllProposalsStateQueryKey(),
      getProposalPayeeQueryKey(proposalId),
      getProposalDescriptionQueryKey(proposalId),
      getProposalImplementationDiscussionQueryKey(proposalId),
      getProposalContributorsQueryKey(proposalId),
    ],
    [proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    onFailure,
    transactionModalCustomUI,
  })
}
