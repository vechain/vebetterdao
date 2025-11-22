import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getUserVotedProposalsQueryKey } from "@/api/contracts/governance/hooks/useUserVotedProposals"
import { buildClause } from "@/utils/buildClause"

import { getHasVotedQueryKey } from "../api/contracts/governance/hooks/useHasVotedInProposals"
import { getIsProposalQuorumReachedQueryKey } from "../api/contracts/governance/hooks/useIsProposalQuorumReached"
import { getProposalsEventsQueryKey } from "../api/contracts/governance/hooks/useProposalsEvents"
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
      getUserVotedProposalsQueryKey(account?.address ?? ""),
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
