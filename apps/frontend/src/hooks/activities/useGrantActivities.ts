import { getConfig } from "@repo/config"
import { useMemo } from "react"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { useEvents } from "../useEvents"

import { ActivityItem, ActivityType } from "./types"

const grantsManagerAddress = getConfig().grantsManagerContractAddress

const milestoneValidatedAbi = [
  {
    type: "event",
    name: "MilestoneValidated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: false },
      { name: "milestoneIndex", type: "uint256", indexed: false },
    ],
  },
] as const

export const useGrantActivities = (currentRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const previousRoundId = currentRoundId && Number(currentRoundId) > 1 ? String(Number(currentRoundId) - 1) : undefined

  const { data: { enrichedGrantProposals } = { enrichedGrantProposals: [] }, isLoading: isProposalsLoading } =
    useProposalEnriched()
  const { data: previousRound, isLoading: isPrevRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: currentRound, isLoading: isCurrRoundLoading } = useAllocationsRound(currentRoundId)

  const milestoneEvents = useEvents({
    abi: milestoneValidatedAbi,
    contractAddress: grantsManagerAddress,
    eventName: "MilestoneValidated",
    select: events =>
      events.map(e => ({
        proposalId: e.decodedData.args.proposalId.toString(),
        milestoneIndex: Number(e.decodedData.args.milestoneIndex),
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []

    const items: ActivityItem[] = []
    const roundEndDate = previousRound?.voteEndTimestamp?.unix() ?? 0

    const succeededGrants = enrichedGrantProposals.filter(
      p =>
        p.votingRoundId === previousRoundId &&
        (p.state === ProposalState.Succeeded ||
          p.state === ProposalState.Queued ||
          p.state === ProposalState.Executed ||
          p.state === ProposalState.InDevelopment ||
          p.state === ProposalState.Completed),
    )

    for (const p of succeededGrants) {
      items.push({
        type: ActivityType.GRANT_APPROVED,
        date: roundEndDate || p.createdAt,
        roundId: currentRoundId,
        title: p.title,
        metadata: { proposalId: p.id, proposalTitle: p.title },
      })
    }

    const roundStartBlock = Number(previousRound?.voteEnd ?? 0)
    const roundEndBlock = Number(currentRound?.voteEnd ?? 0)
    if (roundEndBlock) {
      const isInRound = (blockNumber: number) => blockNumber >= roundStartBlock && blockNumber <= roundEndBlock

      const proposalTitleMap = new Map<string, string>()
      enrichedGrantProposals.forEach(p => proposalTitleMap.set(p.id, p.title))

      const roundMilestones = (milestoneEvents.data ?? []).filter(e => isInRound(e.blockNumber))

      const seenIds = new Set<string>()
      for (const e of roundMilestones) {
        const key = `${e.proposalId}-${e.milestoneIndex}`
        if (seenIds.has(key)) continue
        seenIds.add(key)

        const title = proposalTitleMap.get(e.proposalId)
        if (!title) continue

        items.push({
          type: ActivityType.GRANT_MILESTONE_APPROVED,
          date: e.timestamp,
          roundId: currentRoundId,
          title,
          metadata: { proposalId: e.proposalId, proposalTitle: title },
        })
      }
    }

    return items
  }, [
    currentRoundId,
    previousRoundId,
    enrichedGrantProposals,
    previousRound?.voteEndTimestamp,
    previousRound?.voteEnd,
    currentRound?.voteEnd,
    milestoneEvents.data,
  ])

  return {
    data,
    isLoading: isProposalsLoading || isPrevRoundLoading || isCurrRoundLoading || milestoneEvents.isLoading,
  }
}
