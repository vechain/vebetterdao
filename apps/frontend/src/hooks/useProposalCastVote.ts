import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getHasVotedQueryKey } from "../api/contracts/governance/hooks/useHasVotedInProposals"
import { getIsProposalQuorumReachedQueryKey } from "../api/contracts/governance/hooks/useIsProposalQuorumReached"
import { getUserProposalsVoteEventsQueryKey } from "../api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { getProposalVotesQueryKey } from "../api/indexer/proposals/useProposalVotes"

import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()
type ClausesProps = {
  proposalId: string
  vote: string
  comment: string
}
type Props = { proposalId: string; onSuccess?: () => void }
/**
 * Custom hook for casting a vote on a proposal.
 *
 * @param {string} proposalId - The ID of the proposal.
 *
 * @returns {ReturnType} - The return value of the custom hook.
 */
export const useProposalCastVote = ({ proposalId, onSuccess }: Props) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(({ proposalId, vote, comment = "" }: ClausesProps) => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "castVoteWithReason",
        args: [proposalId, vote, comment],
        comment: "cast proposal vote",
      }),
    ]
  }, [])
  const refetchQueryKeys = useMemo(
    () => [
      getHasVotedQueryKey([proposalId], account?.address ?? undefined),
      getProposalVotesQueryKey(proposalId),
      getIsProposalQuorumReachedQueryKey(proposalId),
      getUserProposalsVoteEventsQueryKey(account?.address ?? undefined),
    ],
    [proposalId, account?.address],
  )

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
