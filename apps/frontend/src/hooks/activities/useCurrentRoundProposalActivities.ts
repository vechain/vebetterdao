import { useMemo } from "react"

import { useAllProposalsDepositReached } from "@/api/contracts/governance/hooks/useAllProposalsDepositReached"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { ActivityItem, ActivityType } from "./types"
import { useProposalStateChangeMaps } from "./useProposalStateChangeMaps"

export const useCurrentRoundProposalActivities = (
  currentRoundId?: string,
): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: { enrichedProposals } = { enrichedProposals: [] }, isLoading: isProposalsLoading } =
    useProposalEnriched()

  const {
    canceledMap,
    inDevelopmentMap,
    completedMap,
    executedMap,
    isLoading: isStateChangesLoading,
  } = useProposalStateChangeMaps()

  const previousRoundId = currentRoundId && Number(currentRoundId) > 1 ? String(Number(currentRoundId) - 1) : undefined
  const { data: previousRound, isLoading: isPreviousRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: currentRound, isLoading: isCurrentRoundLoading } = useAllocationsRound(currentRoundId)

  const currentRoundProposals = useMemo(() => {
    if (!currentRoundId || currentRoundId === "0") return []
    return enrichedProposals.filter(p => p.votingRoundId === currentRoundId)
  }, [currentRoundId, enrichedProposals])

  const proposalIds = useMemo(() => currentRoundProposals.map(p => p.id), [currentRoundProposals])

  const { data: depositsReached, isLoading: isDepositsLoading } = useAllProposalsDepositReached(proposalIds)

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []

    const roundStart = previousRound?.voteEndTimestamp?.unix() ?? 0
    const roundEnd = currentRound?.voteEndTimestamp?.unix() ?? Infinity
    const isInRound = (ts: number) => ts >= roundStart && ts <= roundEnd

    const pendingActivities: ActivityItem[] = currentRoundProposals
      .map((p): ActivityItem | null => {
        if (p.state !== ProposalState.Pending) return null

        const isDepositReached = depositsReached?.find(d => d.proposalId === p.id)?.depositReached
        return {
          type: isDepositReached ? ActivityType.PROPOSAL_SUPPORTED : ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT,
          date: p.createdAt,
          roundId: currentRoundId,
          title: p.title,
          metadata: { proposalId: p.id, proposalTitle: p.title, state: p.state },
        }
      })
      .filter((item): item is ActivityItem => item !== null)

    const lifecycleActivities: ActivityItem[] = enrichedProposals
      .map((p): ActivityItem | null => {
        let activityType: ActivityType | undefined
        let date: number | undefined

        if (p.state === ProposalState.Canceled) {
          activityType = ActivityType.PROPOSAL_CANCELLED
          date = canceledMap.get(p.id)
        } else if (p.state === ProposalState.InDevelopment) {
          activityType = ActivityType.PROPOSAL_IN_DEVELOPMENT
          date = inDevelopmentMap.get(p.id)
        } else if (p.state === ProposalState.Executed) {
          activityType = ActivityType.PROPOSAL_EXECUTED
          date = executedMap.get(p.id)
        } else if (p.state === ProposalState.Completed) {
          activityType = ActivityType.PROPOSAL_EXECUTED
          date = completedMap.get(p.id)
        }

        if (!activityType || date === undefined) return null
        if (!isInRound(date)) return null

        return {
          type: activityType,
          date,
          roundId: currentRoundId,
          title: p.title,
          metadata: { proposalId: p.id, proposalTitle: p.title, state: p.state },
        }
      })
      .filter((item): item is ActivityItem => item !== null)

    return [...pendingActivities, ...lifecycleActivities]
  }, [
    currentRoundId,
    currentRoundProposals,
    enrichedProposals,
    depositsReached,
    canceledMap,
    inDevelopmentMap,
    completedMap,
    executedMap,
    previousRound?.voteEndTimestamp,
    currentRound?.voteEndTimestamp,
  ])

  return {
    data,
    isLoading:
      isProposalsLoading ||
      isDepositsLoading ||
      isStateChangesLoading ||
      isPreviousRoundLoading ||
      isCurrentRoundLoading,
  }
}
