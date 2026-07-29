import { useMemo } from "react"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useAllocationVoters } from "@/api/contracts/xAllocations/hooks/useAllocationVoters"
import { useAllocationVotes } from "@/api/contracts/xAllocations/hooks/useAllocationVotes"
import { useMostVotedAppsInRound } from "@/api/contracts/xApps/hooks/useMostVotedAppsInRound"

import { ActivityItem, ActivityType } from "./types"

export const useRoundActivities = (previousRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: round, isLoading: isRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: voters, isLoading: isVotersLoading } = useAllocationVoters(previousRoundId)
  const { data: totalVotes, isLoading: isTotalVotesLoading } = useAllocationVotes(previousRoundId)
  const { data: mostVotedApps, isLoading: isMostVotedLoading } = useMostVotedAppsInRound(previousRoundId)

  const data = useMemo((): ActivityItem[] => {
    if (!previousRoundId || previousRoundId === "0") return []

    const voteEndTimestamp = round?.voteEndTimestamp
    if (!voteEndTimestamp) return []

    const date = voteEndTimestamp.unix()
    const votersCount = voters ? Number(voters) : 0
    const topApps = mostVotedApps.slice(0, 3).map(a => ({
      appId: a.id,
      appName: a.app?.name ?? "",
      percentage: a.percentage,
    }))

    return [
      {
        type: ActivityType.ROUND_ENDED,
        date,
        roundId: previousRoundId,
        title: `Round ${previousRoundId} ended`,
        metadata: {
          votersCount,
          totalVotes: totalVotes ?? "0",
          topApps,
        },
      },
    ]
  }, [previousRoundId, round?.voteEndTimestamp, voters, totalVotes, mostVotedApps])

  return {
    data,
    isLoading: isRoundLoading || isVotersLoading || isTotalVotesLoading || isMostVotedLoading,
  }
}
