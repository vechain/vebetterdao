import { useMemo } from "react"

import { useAllProposalsDepositReached } from "@/api/contracts/governance/hooks/useAllProposalsDepositReached"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { ActivityItem, ActivityType } from "./types"

type CurrentRoundActivityType =
  | ActivityType.PROPOSAL_CANCELLED
  | ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT
  | ActivityType.PROPOSAL_SUPPORTED
  | ActivityType.PROPOSAL_IN_DEVELOPMENT
  | ActivityType.PROPOSAL_EXECUTED

export const useCurrentRoundProposalActivities = (
  currentRoundId?: string,
): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: { enrichedProposals } = { enrichedProposals: [] }, isLoading: isProposalsLoading } =
    useProposalEnriched()

  const currentRoundProposals = useMemo(() => {
    if (!currentRoundId || currentRoundId === "0") return []
    return enrichedProposals.filter(p => p.votingRoundId === currentRoundId)
  }, [currentRoundId, enrichedProposals])

  const proposalIds = useMemo(() => currentRoundProposals.map(p => p.id), [currentRoundProposals])

  const { data: depositsReached, isLoading: isDepositsLoading } = useAllProposalsDepositReached(proposalIds)

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []

    return currentRoundProposals
      .map((p): ActivityItem | null => {
        let activityType: CurrentRoundActivityType | undefined

        if (p.state === ProposalState.Canceled) {
          activityType = ActivityType.PROPOSAL_CANCELLED
        } else if (p.state === ProposalState.Pending) {
          const isDepositReached = depositsReached?.find(d => d.proposalId === p.id)?.depositReached
          activityType = isDepositReached ? ActivityType.PROPOSAL_SUPPORTED : ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT
        } else if (p.state === ProposalState.InDevelopment) {
          activityType = ActivityType.PROPOSAL_IN_DEVELOPMENT
        } else if (p.state === ProposalState.Executed || p.state === ProposalState.Completed) {
          activityType = ActivityType.PROPOSAL_EXECUTED
        }

        if (!activityType) return null

        return {
          type: activityType,
          date: p.createdAt,
          roundId: currentRoundId,
          title: p.title,
          metadata: {
            proposalId: p.id,
            proposalTitle: p.title,
            state: p.state,
          },
        }
      })
      .filter((item): item is ActivityItem => item !== null)
  }, [currentRoundId, currentRoundProposals, depositsReached])

  return { data, isLoading: isProposalsLoading || isDepositsLoading }
}
