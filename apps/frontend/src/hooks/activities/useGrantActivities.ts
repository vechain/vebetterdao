import { useMemo } from "react"

import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { ActivityItem, ActivityType } from "./types"

type GrantActivityType = ActivityType.GRANT_APPROVED | ActivityType.GRANT_MILESTONE_APPROVED

export const useGrantActivities = (currentRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: { enrichedGrantProposals } = { enrichedGrantProposals: [] }, isLoading } = useProposalEnriched()

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []

    return enrichedGrantProposals
      .filter(p => p.votingRoundId === currentRoundId)
      .map((p): ActivityItem | null => {
        let activityType: GrantActivityType | undefined

        if (p.state === ProposalState.Succeeded) {
          activityType = ActivityType.GRANT_APPROVED
        } else if (p.state === ProposalState.Executed || p.state === ProposalState.Completed) {
          activityType = ActivityType.GRANT_MILESTONE_APPROVED
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
          },
        }
      })
      .filter((item): item is ActivityItem => item !== null)
  }, [currentRoundId, enrichedGrantProposals])

  return { data, isLoading }
}
