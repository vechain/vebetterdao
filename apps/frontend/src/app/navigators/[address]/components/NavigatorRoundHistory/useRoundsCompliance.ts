import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useCurrentBlock } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useGetMinorSlashPercentage } from "@/api/contracts/navigatorRegistry/hooks/useGetMinorSlashPercentage"
import { useGetPreferenceCutoffPeriod } from "@/api/contracts/navigatorRegistry/hooks/useGetPreferenceCutoffPeriod"
import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useIsSlashedFor, type SlashedRoundResult } from "@/api/contracts/navigatorRegistry/hooks/useIsSlashedFor"
import { useNavigatorDecisionEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorDecisionEvents"
import {
  useNavigatorMinorSlashEventsByRound,
  type NavigatorMinorSlashEvent,
} from "@/api/contracts/navigatorRegistry/hooks/useNavigatorMinorSlashEvent"
import { useNavigatorPreferenceEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorPreferenceEvents"
import { useNavigatorReportEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorReportEvents"
import { useAllocationsRoundsEvents } from "@/api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useUserVotesInAllRounds } from "@/api/contracts/xApps/hooks/useUserVotesInAllRounds"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { type ReportableInfraction } from "@/hooks/navigator/useReportNavigatorInfraction"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { useEvents } from "@/hooks/useEvents"

import { type ProposalTask, type RoundCompliance, type RoundVote, type TaskStatus } from "./types"
import { groupVotesByRound } from "./utils"

export type RoundsComplianceResult = {
  rounds: RoundCompliance[]
  roundVotesMap: Map<string, RoundVote>
  infractionsByRound: Map<string, ReportableInfraction[]>
  slashedByRound: Map<string, SlashedRoundResult> | undefined
  slashEventsByRound: Map<string, NavigatorMinorSlashEvent> | undefined
  /** Pre-slash estimate; only used as a fallback while the slash event is loading. */
  estimatedPenaltyAmount: number
}

/**
 * Aggregates every data source needed to render a navigator's round history:
 * compliance per round (allocation vote, governance votes, report), freshness
 * multiplier, infractions surfaced for reporting, and slash details.
 *
 * Per-round actual amount is read from the on-chain `NavigatorMinorSlashed`
 * event; current stake is already reduced post-slash, so the estimate
 * undershoots and is used only as a transient fallback.
 */
export const useRoundsCompliance = (address: string): RoundsComplianceResult => {
  const { data: roundsData } = useAllocationsRoundsEvents()
  const { data: prefEvents } = useNavigatorPreferenceEvents(address)
  const { data: reportEvents } = useNavigatorReportEvents(address)
  const { data: voteEvents } = useUserVotesInAllRounds(address)
  const { data: decisionEvents } = useNavigatorDecisionEvents(address)
  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const { data: cutoffPeriod } = useGetPreferenceCutoffPeriod()
  const { data: reportInterval } = useGetReportInterval()
  const { data: currentBlock } = useCurrentBlock()
  const { data: currentAllocationsRoundId } = useCurrentAllocationsRoundId()
  const { data: xApps } = useXApps()

  const { data: regBlockData } = useEvents({
    contractAddress: getConfig().navigatorRegistryContractAddress,
    abi: NavigatorRegistry__factory.abi,
    eventName: "NavigatorRegistered",
    filterParams: { navigator: address as `0x${string}` },
    select: events => events[0]?.meta.blockNumber ?? 0,
  })
  const registrationBlock = regBlockData ?? 0

  const { data: freshnessEvents } = useEvents({
    abi: XAllocationVoting__factory.abi,
    contractAddress: getConfig().xAllocationVotingContractAddress,
    eventName: "FreshnessMultiplierApplied",
    filterParams: { voter: address as `0x${string}` },
    select: events =>
      events.map(({ decodedData }) => ({
        roundId: decodedData.args.roundId.toString(),
        multiplier: Number(decodedData.args.multiplier),
        lastChangedRound: Number(decodedData.args.lastChangedRound),
      })),
    enabled: !!address,
  })

  const freshnessByRound = useMemo(() => {
    const map = new Map<string, { label: string; isFirstVote: boolean; isUpdated: boolean }>()
    if (!freshnessEvents) return map
    for (const e of freshnessEvents) {
      const label = `x${e.multiplier / 10000}`
      const roundsSinceChange = Number(e.roundId) - e.lastChangedRound
      map.set(e.roundId, {
        label,
        isFirstVote: e.lastChangedRound === 0,
        isUpdated: roundsSinceChange === 0,
      })
    }
    return map
  }, [freshnessEvents])

  const roundVotesMap = useMemo(() => {
    const map = groupVotesByRound(voteEvents ?? [], xApps?.allApps)
    for (const [roundId, rv] of map) {
      const freshness = freshnessByRound.get(roundId)
      if (freshness) {
        rv.freshnessLabel = freshness.label
        rv.isFirstVote = freshness.isFirstVote
        rv.isUpdated = freshness.isUpdated
      }
    }
    return map
  }, [voteEvents, xApps?.allApps, freshnessByRound])

  const rounds = useMemo<RoundCompliance[]>(() => {
    if (!roundsData?.created?.length) return []

    const prefMap = new Map<string, number>()
    for (const ev of prefEvents ?? []) {
      prefMap.set(ev.roundId, ev.blockNumber)
    }

    const voteRounds = new Set<string>()
    for (const ev of voteEvents ?? []) {
      voteRounds.add(ev.roundId)
    }

    const decisionSet = new Set<string>()
    for (const ev of decisionEvents ?? []) {
      decisionSet.add(ev.proposalId)
    }

    const proposalsByRound = new Map<string, { id: string; title: string }[]>()
    for (const p of enrichedProposals) {
      if (!p.votingRoundId) continue
      const existing = proposalsByRound.get(p.votingRoundId) ?? []
      existing.push({ id: p.id, title: p.title })
      proposalsByRound.set(p.votingRoundId, existing)
    }

    const reportMap = new Map<string, string>()
    for (const ev of reportEvents ?? []) {
      reportMap.set(ev.roundId, ev.reportURI)
    }

    const allReportRounds = new Set(reportMap.keys())

    const blockNum = currentBlock != null ? Number(currentBlock.number) : null

    return roundsData.created
      .filter(round => registrationBlock > 0 && Number(round.voteStart) >= registrationBlock)
      .map(round => {
        const voteEnd = Number(round.voteEnd)
        const isRoundStillOpen =
          blockNum != null
            ? blockNum <= voteEnd
            : currentAllocationsRoundId != null && round.roundId === currentAllocationsRoundId
        const cutoffBlock = cutoffPeriod != null ? voteEnd - cutoffPeriod : voteEnd

        const voted = voteRounds.has(round.roundId)
        const prefBlock = prefMap.get(round.roundId)

        let allocationStatus: TaskStatus
        if (isRoundStillOpen && !voted) {
          allocationStatus = "pending"
        } else if (!voted) {
          allocationStatus = "missed"
        } else if (prefBlock != null && prefBlock > cutoffBlock) {
          allocationStatus = "late"
        } else {
          allocationStatus = "done"
        }

        const roundProposals = proposalsByRound.get(round.roundId) ?? []
        const proposals: ProposalTask[] = roundProposals.map(p => ({
          proposalId: p.id,
          title: p.title,
          status: isRoundStillOpen && !decisionSet.has(p.id) ? "pending" : decisionSet.has(p.id) ? "done" : "missed",
        }))

        const roundNum = Number(round.roundId)
        let reportDue = false
        if (reportInterval != null && reportInterval > 0) {
          let lastReportBefore = 0
          for (const rr of allReportRounds) {
            const rrNum = Number(rr)
            if (rrNum < roundNum && rrNum > lastReportBefore) lastReportBefore = rrNum
          }
          // Must match NavigatorSlashingUtils: roundId >= lastReport + reportInterval
          reportDue = roundNum >= lastReportBefore + reportInterval
        }

        return {
          roundId: round.roundId,
          voteEnd,
          isRoundStillOpen,
          allocationStatus,
          proposals,
          reportSubmitted: reportMap.has(round.roundId),
          reportDue,
          reportURI: reportMap.get(round.roundId),
        }
      })
      .sort((a, b) => Number(b.roundId) - Number(a.roundId))
  }, [
    roundsData,
    prefEvents,
    reportEvents,
    voteEvents,
    decisionEvents,
    enrichedProposals,
    cutoffPeriod,
    reportInterval,
    registrationBlock,
    currentBlock,
    currentAllocationsRoundId,
  ])

  /** Build infractions for every closed round that has issues. */
  const infractionsByRound = useMemo(() => {
    const map = new Map<string, ReportableInfraction[]>()
    for (const round of rounds) {
      if (round.isRoundStillOpen) continue
      const result: ReportableInfraction[] = []
      const { roundId, voteEnd, allocationStatus, proposals, reportDue, reportSubmitted } = round

      if (allocationStatus === "missed") {
        result.push({ type: "missedAllocationVote", roundId })
      }
      if (allocationStatus === "late") {
        result.push({ type: "latePreferences", roundId, voteEnd })
      }
      for (const p of proposals) {
        if (p.status === "missed") {
          result.push({ type: "missedGovernanceVote", roundId, proposalId: p.proposalId, proposalTitle: p.title })
        }
      }
      if (reportDue && !reportSubmitted) {
        result.push({ type: "missedReport", roundId })
      }

      if (result.length > 0) map.set(roundId, result)
    }
    return map
  }, [rounds])

  const infractionRoundIds = useMemo(() => Array.from(infractionsByRound.keys()), [infractionsByRound])
  const { data: slashedByRound } = useIsSlashedFor(address, infractionRoundIds)
  const { data: stake } = useGetStake(address)
  const { data: slashBps } = useGetMinorSlashPercentage()
  const stakeNum = stake ? Number(stake.scaled) : 0
  const estimatedPenaltyAmount = slashBps != null ? (stakeNum * slashBps) / 10_000 : 0
  const { data: slashEventsByRound } = useNavigatorMinorSlashEventsByRound(address)

  return {
    rounds,
    roundVotesMap,
    infractionsByRound,
    slashedByRound,
    slashEventsByRound,
    estimatedPenaltyAmount,
  }
}
