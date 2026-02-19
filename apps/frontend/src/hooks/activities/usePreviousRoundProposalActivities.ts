import { useMemo } from "react"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { ActivityItem, ActivityType } from "./types"

type PreviousRoundActivityType =
  | ActivityType.PROPOSAL_VOTED_FOR
  | ActivityType.PROPOSAL_VOTED_AGAINST
  | ActivityType.PROPOSAL_SUPPORT_NOT_REACHED

const stateToActivityType: Partial<Record<ProposalState, PreviousRoundActivityType>> = {
  [ProposalState.Succeeded]: ActivityType.PROPOSAL_VOTED_FOR,
  [ProposalState.Defeated]: ActivityType.PROPOSAL_VOTED_AGAINST,
  [ProposalState.DepositNotMet]: ActivityType.PROPOSAL_SUPPORT_NOT_REACHED,
}

export const usePreviousRoundProposalActivities = (
  previousRoundId?: string,
): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: { enrichedProposals } = { enrichedProposals: [] }, isLoading: isProposalsLoading } =
    useProposalEnriched()
  const { data: round, isLoading: isRoundLoading } = useAllocationsRound(previousRoundId)

  const data = useMemo((): ActivityItem[] => {
    if (!previousRoundId || previousRoundId === "0") return []

    const date = round?.voteEndTimestamp?.unix() ?? 0

    return enrichedProposals
      .filter(p => p.votingRoundId === previousRoundId && stateToActivityType[p.state] !== undefined)
      .map(p => ({
        type: stateToActivityType[p.state]!,
        date,
        roundId: previousRoundId,
        title: p.title,
        metadata: {
          proposalId: p.id,
          proposalTitle: p.title,
          state: p.state,
        },
      }))
  }, [previousRoundId, enrichedProposals, round?.voteEndTimestamp])

  return { data, isLoading: isProposalsLoading || isRoundLoading }
}
