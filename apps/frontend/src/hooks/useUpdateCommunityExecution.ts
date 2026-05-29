import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import { getProposalContributorsQueryKey } from "../api/contracts/governance/hooks/useProposalContributors"
import { getProposalDescriptionQueryKey } from "../api/contracts/governance/hooks/useProposalDescription"
import { getProposalImplementationDiscussionQueryKey } from "../api/contracts/governance/hooks/useProposalImplementationDiscussion"
import { getProposalPayeeQueryKey } from "../api/contracts/governance/hooks/useProposalPayee"

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
 * V11: update payee / description / implementation-discussion / contributors of a proposal
 * whose payout has not yet been claimed. Callable by the proposer or by an admin holding
 * PROPOSAL_STATE_MANAGER_ROLE; allowed while the proposal is InDevelopment or Completed.
 */
export const useUpdateCommunityExecution = ({ proposalId, onSuccess, onFailure, transactionModalCustomUI }: Props) => {
  const clauseBuilder = useCallback(
    ({ payee, description, implementationDiscussion, contributors }: SendArgs) => {
      return [
        buildClause({
          to: getConfig().b3trGovernorAddress,
          contractInterface: GovernorInterface,
          method: "updateCommunityExecution",
          args: [proposalId, payee, description, implementationDiscussion, contributors],
          comment: "update proposal payee + metadata before payout",
        }),
      ]
    },
    [proposalId],
  )

  const refetchQueryKeys = useMemo(
    () => [
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
