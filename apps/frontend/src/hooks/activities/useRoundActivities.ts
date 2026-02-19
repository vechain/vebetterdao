import { useMemo } from "react"

import { useVot3PastSupply } from "@/api/contracts/vot3/hooks/useVot3PastTotalSupply"
import { useAllocationRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useAllocationRoundSnapshot"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useAllocationVoters } from "@/api/contracts/xAllocations/hooks/useAllocationVoters"
import { useMostVotedAppsInRound } from "@/api/contracts/xApps/hooks/useMostVotedAppsInRound"

import { ActivityItem, ActivityType } from "./types"

export const useRoundActivities = (previousRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: round, isLoading: isRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: voters, isLoading: isVotersLoading } = useAllocationVoters(previousRoundId)
  const { data: snapshot, isLoading: isSnapshotLoading } = useAllocationRoundSnapshot(previousRoundId ?? "0")
  const { data: vot3Total, isLoading: isVot3Loading } = useVot3PastSupply(snapshot)
  const { data: mostVotedApps, isLoading: isMostVotedLoading } = useMostVotedAppsInRound(previousRoundId)

  const data = useMemo((): ActivityItem[] => {
    if (!previousRoundId || previousRoundId === "0") return []

    const date = round?.voteEndTimestamp?.unix() ?? 0
    const votersCount = voters ? Number(voters) : 0
    const topApps = mostVotedApps.slice(0, 3).map(a => ({
      appId: a.id,
      appName: a.app?.name ?? "",
    }))

    return [
      {
        type: ActivityType.ROUND_ENDED,
        date,
        roundId: previousRoundId,
        title: `Round ${previousRoundId} ended`,
        metadata: {
          votersCount,
          vot3Total: vot3Total ?? "0",
          topApps,
        },
      },
    ]
  }, [previousRoundId, round?.voteEndTimestamp, voters, vot3Total, mostVotedApps])

  return {
    data,
    isLoading: isRoundLoading || isVotersLoading || isSnapshotLoading || isVot3Loading || isMostVotedLoading,
  }
}
