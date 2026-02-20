import { useMemo } from "react"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { ActivityItem, ActivityType } from "./types"
import { useProposalStateChangeMaps } from "./useProposalStateChangeMaps"

type GrantActivityType = ActivityType.GRANT_APPROVED | ActivityType.GRANT_MILESTONE_APPROVED

export const useGrantActivities = (currentRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: { enrichedGrantProposals } = { enrichedGrantProposals: [] }, isLoading: isProposalsLoading } =
    useProposalEnriched()
  const { data: round, isLoading: isRoundLoading } = useAllocationsRound(currentRoundId)
  const { completedMap, executedMap, isLoading: isStateChangesLoading } = useProposalStateChangeMaps()

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []

    const roundEndDate = round?.voteEndTimestamp?.unix() ?? 0

    return enrichedGrantProposals
      .filter(p => p.votingRoundId === currentRoundId)
      .map((p): ActivityItem | null => {
        let activityType: GrantActivityType | undefined
        let date = p.createdAt

        if (p.state === ProposalState.Succeeded) {
          activityType = ActivityType.GRANT_APPROVED
          date = roundEndDate || date
        } else if (p.state === ProposalState.Executed) {
          activityType = ActivityType.GRANT_MILESTONE_APPROVED
          date = executedMap.get(p.id) ?? date
        } else if (p.state === ProposalState.Completed) {
          activityType = ActivityType.GRANT_MILESTONE_APPROVED
          date = completedMap.get(p.id) ?? date
        }

        if (!activityType) return null

        return {
          type: activityType,
          date,
          roundId: currentRoundId,
          title: p.title,
          metadata: {
            proposalId: p.id,
            proposalTitle: p.title,
          },
        }
      })
      .filter((item): item is ActivityItem => item !== null)
  }, [currentRoundId, enrichedGrantProposals, round?.voteEndTimestamp, completedMap, executedMap])

  return { data, isLoading: isProposalsLoading || isRoundLoading || isStateChangesLoading }
}
