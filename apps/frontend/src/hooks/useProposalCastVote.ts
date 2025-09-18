import { useCallback, useMemo } from "react"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { getProposalsEventsQueryKey, getProposalVotesQueryKey, getUserProposalsVoteEventsQueryKey } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { getIsProposalQuorumReachedQueryKey } from "@/api/contracts/governance/hooks/useIsProposalQuorumReached"
import { useWallet } from "@vechain/vechain-kit"

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
      getProposalVotesQueryKey(proposalId),
      getIsProposalQuorumReachedQueryKey(proposalId),
      getUserProposalsVoteEventsQueryKey(account?.address ?? undefined),
      getProposalsEventsQueryKey(),
    ],
    [proposalId, account?.address],
  )

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
