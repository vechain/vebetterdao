import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { useEvents } from "@/hooks/useEvents"

import { ActivityItem, ActivityType, UserProposalSupportMeta, UserProposalVoteMeta } from "./types"

const xAllocationAbi = XAllocationVoting__factory.abi
const xAllocationAddress = getConfig().xAllocationVotingContractAddress
const b3trGovernorAbi = B3TRGovernor__factory.abi
const b3trGovernorAddress = getConfig().b3trGovernorAddress

export const useUserVotingActivities = (selectedRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const { account } = useWallet()
  const { data: xApps } = useXApps()
  const { data: { enrichedStandardProposals = [], enrichedGrantProposals = [] } = {}, isLoading: isProposalsLoading } =
    useProposalEnriched()

  const previousRoundId =
    selectedRoundId && Number(selectedRoundId) > 1 ? String(Number(selectedRoundId) - 1) : undefined
  const { data: previousRound, isLoading: isPreviousRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: currentRound, isLoading: isCurrentRoundLoading } = useAllocationsRound(selectedRoundId)

  const allocationVoteEvents = useEvents({
    abi: xAllocationAbi,
    contractAddress: xAllocationAddress,
    eventName: "AllocationVoteCast",
    filterParams: { voter: (account?.address ?? "") as `0x${string}` },
    select: events =>
      events.map(e => ({
        roundId: e.decodedData.args.roundId.toString(),
        appsIds: [...e.decodedData.args.appsIds],
        voteWeights: [...e.decodedData.args.voteWeights].map(w => w.toString()),
        timestamp: e.meta.blockTimestamp,
      })),
    enabled: !!account?.address,
  })

  const allocationAutoVoteEvents = useEvents({
    abi: xAllocationAbi,
    contractAddress: xAllocationAddress,
    eventName: "AllocationAutoVoteCast",
    filterParams: { voter: (account?.address ?? "") as `0x${string}` },
    select: events =>
      events.map(e => ({
        roundId: e.decodedData.args.roundId.toString(),
        appsIds: [...e.decodedData.args.appsIds],
        voteWeights: [...e.decodedData.args.voteWeights].map(w => w.toString()),
        timestamp: e.meta.blockTimestamp,
      })),
    enabled: !!account?.address,
  })

  const proposalVoteEvents = useEvents({
    abi: b3trGovernorAbi,
    contractAddress: b3trGovernorAddress,
    eventName: "VoteCast",
    filterParams: { voter: (account?.address ?? "") as `0x${string}` },
    select: events =>
      events.map(e => ({
        proposalId: e.decodedData.args.proposalId.toString(),
        support: Number(e.decodedData.args.support),
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
    enabled: !!account?.address,
  })
  const proposalSupportEvents = useEvents({
    abi: b3trGovernorAbi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalDeposit",
    filterParams: { depositor: (account?.address ?? "") as `0x${string}` },
    select: events =>
      events.map(e => ({
        proposalId: e.decodedData.args.proposalId.toString(),
        amount: e.decodedData.args.amount.toString(),
        timestamp: e.meta.blockTimestamp,
      })),
    enabled: !!account?.address,
  })

  const data = useMemo((): ActivityItem[] => {
    if (!account?.address || !selectedRoundId) return []

    const appNameMap = new Map<string, string>()
    for (const app of xApps?.allApps ?? []) {
      appNameMap.set(app.id, app.name ?? "")
    }

    const proposalInfoMap = new Map<
      string,
      { title: string; votingRoundId: string; proposalType: "grant" | "proposal" }
    >()
    enrichedStandardProposals.forEach(p => {
      proposalInfoMap.set(p.id, { title: p.title, votingRoundId: p.votingRoundId, proposalType: "proposal" })
    })
    enrichedGrantProposals.forEach(p => {
      proposalInfoMap.set(p.id, { title: p.title, votingRoundId: p.votingRoundId, proposalType: "grant" })
    })

    const allAllocationEvents = [...(allocationVoteEvents.data ?? []), ...(allocationAutoVoteEvents.data ?? [])]
      .filter(e => e.roundId === selectedRoundId)
      .sort((a, b) => b.timestamp - a.timestamp)
    const latestByRound = allAllocationEvents[0]
    const allocationItems: ActivityItem[] =
      latestByRound == null
        ? []
        : [
            {
              type: ActivityType.USER_ALLOCATION_VOTE_CAST,
              date: latestByRound.timestamp,
              roundId: latestByRound.roundId,
              title: `You voted in round ${latestByRound.roundId}`,
              metadata: {
                apps: latestByRound.appsIds.map((appId, i) => ({
                  appId,
                  appName: appNameMap.get(appId) ?? "",
                  voteWeight: latestByRound.voteWeights[i] ?? "0",
                })),
              },
            },
          ]

    const proposalVotes = (proposalVoteEvents.data ?? []).filter(e => {
      const info = proposalInfoMap.get(e.proposalId)
      return info?.votingRoundId === selectedRoundId
    })

    const proposalItems: ActivityItem[] = proposalVotes
      .map(e => {
        const info = proposalInfoMap.get(e.proposalId)
        if (!info?.title) return null
        const title = info.title
        const supportLabel = e.support === 1 ? "for" : e.support === 0 ? "against" : "abstain"
        return {
          type: ActivityType.USER_PROPOSAL_VOTE_CAST as const,
          date: e.timestamp,
          roundId: selectedRoundId,
          title: `You voted ${supportLabel} "${title}"`,
          metadata: {
            proposalId: e.proposalId,
            proposalTitle: title,
            support: e.support,
            proposalType: info.proposalType,
          },
        }
      })
      .filter(
        (item): item is ActivityItem & { type: ActivityType.USER_PROPOSAL_VOTE_CAST; metadata: UserProposalVoteMeta } =>
          item !== null,
      )

    const roundStart = previousRound?.voteEndTimestamp?.unix() ?? 0
    const roundEnd = currentRound?.voteEndTimestamp?.unix() ?? Infinity

    const proposalSupports = (proposalSupportEvents.data ?? []).filter(e => {
      if (!proposalInfoMap.has(e.proposalId)) return false
      return e.timestamp >= roundStart && e.timestamp <= roundEnd
    })

    const proposalSupportItems: ActivityItem[] = proposalSupports
      .map(e => {
        const info = proposalInfoMap.get(e.proposalId)
        if (!info?.title) return null
        return {
          type: ActivityType.USER_PROPOSAL_SUPPORT as const,
          date: e.timestamp,
          roundId: selectedRoundId,
          title: `You supported "${info.title}"`,
          metadata: {
            proposalId: e.proposalId,
            proposalTitle: info.title,
            amount: e.amount,
            proposalType: info.proposalType,
          },
        }
      })
      .filter(
        (
          item,
        ): item is ActivityItem & { type: ActivityType.USER_PROPOSAL_SUPPORT; metadata: UserProposalSupportMeta } =>
          item !== null,
      )

    return [...allocationItems, ...proposalItems, ...proposalSupportItems].sort((a, b) => b.date - a.date)
  }, [
    account?.address,
    selectedRoundId,
    xApps?.allApps,
    enrichedStandardProposals,
    enrichedGrantProposals,
    allocationVoteEvents.data,
    allocationAutoVoteEvents.data,
    proposalVoteEvents.data,
    proposalSupportEvents.data,
    previousRound?.voteEndTimestamp,
    currentRound?.voteEndTimestamp,
  ])

  const isLoading =
    allocationVoteEvents.isLoading ||
    allocationAutoVoteEvents.isLoading ||
    proposalVoteEvents.isLoading ||
    proposalSupportEvents.isLoading ||
    isProposalsLoading ||
    isPreviousRoundLoading ||
    isCurrentRoundLoading

  return { data, isLoading }
}
