"use client"

import { Badge, Button, Card, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuCircle,
  LuEye,
  LuFileText,
  LuFlag,
  LuGavel,
  LuVote,
  LuX,
} from "react-icons/lu"

import { useGetMinorSlashPercentage } from "@/api/contracts/navigatorRegistry/hooks/useGetMinorSlashPercentage"
import { useGetPreferenceCutoffPeriod } from "@/api/contracts/navigatorRegistry/hooks/useGetPreferenceCutoffPeriod"
import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useGetTotalDelegatedAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetTotalDelegatedAtTimepoint"
import { useIsSlashedFor } from "@/api/contracts/navigatorRegistry/hooks/useIsSlashedFor"
import { useNavigatorDecisionEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorDecisionEvents"
import { useNavigatorPreferenceEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorPreferenceEvents"
import { useNavigatorReportEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorReportEvents"
import { useAllocationRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useAllocationRoundSnapshot"
import { useAllocationsRoundsEvents } from "@/api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useUserVotesInAllRounds } from "@/api/contracts/xApps/hooks/useUserVotesInAllRounds"
import { type ReportableInfraction } from "@/hooks/navigator/useReportNavigatorInfraction"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { useEvents } from "@/hooks/useEvents"

import { ReportNavigatorModal } from "./modals/ReportNavigatorModal"
import { ViewReportModal } from "./modals/ViewReportModal"

const formatter = getCompactFormatter(2)
const PREVIEW_ROUNDS = 5

type TaskStatus = "done" | "late" | "missed"

type ProposalTask = {
  proposalId: string
  title: string
  status: TaskStatus
}

type RoundCompliance = {
  roundId: string
  voteEnd: number
  allocationStatus: TaskStatus
  proposals: ProposalTask[]
  reportSubmitted: boolean
  reportDue: boolean
  reportURI?: string
}

type Props = {
  address: string
  isOwnPage: boolean
}

export const NavigatorRoundHistory = ({ address, isOwnPage }: Props) => {
  const { t } = useTranslation()
  const [visibleCount, setVisibleCount] = useState(PREVIEW_ROUNDS)
  const [expandedRound, setExpandedRound] = useState<string | null>(null)
  const [viewReportURI, setViewReportURI] = useState<string | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)

  const { data: roundsData } = useAllocationsRoundsEvents()
  const { data: prefEvents } = useNavigatorPreferenceEvents(address)
  const { data: reportEvents } = useNavigatorReportEvents(address)
  const { data: voteEvents } = useUserVotesInAllRounds(address)
  const { data: decisionEvents } = useNavigatorDecisionEvents(address)
  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const { data: cutoffPeriod } = useGetPreferenceCutoffPeriod()
  const { data: reportInterval } = useGetReportInterval()
  const { data: stake } = useGetStake(address)
  const { data: slashBps } = useGetMinorSlashPercentage()

  const { data: regBlockData } = useEvents({
    contractAddress: getConfig().navigatorRegistryContractAddress,
    abi: NavigatorRegistry__factory.abi,
    eventName: "NavigatorRegistered",
    filterParams: { navigator: address as `0x${string}` },
    select: events => events[0]?.meta.blockNumber ?? 0,
  })
  const registrationBlock = regBlockData ?? 0

  const rounds = useMemo((): RoundCompliance[] => {
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

    return roundsData.created
      .filter(round => registrationBlock > 0 && Number(round.voteStart) >= registrationBlock)
      .map(round => {
        const voteEnd = Number(round.voteEnd)
        const cutoffBlock = cutoffPeriod != null ? voteEnd - cutoffPeriod : voteEnd

        const voted = voteRounds.has(round.roundId)
        const prefBlock = prefMap.get(round.roundId)

        let allocationStatus: TaskStatus
        if (!voted) {
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
          status: decisionSet.has(p.id) ? "done" : "missed",
        }))

        const roundNum = Number(round.roundId)
        let reportDue = false
        if (reportInterval != null && reportInterval > 0) {
          let lastReportBefore = 0
          for (const rr of allReportRounds) {
            const rrNum = Number(rr)
            if (rrNum < roundNum && rrNum > lastReportBefore) lastReportBefore = rrNum
          }
          reportDue = roundNum - lastReportBefore >= reportInterval
        }

        return {
          roundId: round.roundId,
          voteEnd,
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
  ])

  const previousRound = rounds[0] ?? null
  const prevRoundId = previousRound?.roundId ?? ""

  const { data: snapshotBlock } = useAllocationRoundSnapshot(prevRoundId)
  const { data: delegatedAtSnapshot } = useGetTotalDelegatedAtTimepoint(address, snapshotBlock ?? undefined)
  const hadDelegations = delegatedAtSnapshot ? delegatedAtSnapshot.raw > 0n : false

  const infractions = useMemo((): ReportableInfraction[] => {
    if (!previousRound || !hadDelegations) return []
    const result: ReportableInfraction[] = []
    const { roundId, voteEnd, allocationStatus, proposals, reportDue, reportSubmitted } = previousRound

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

    return result
  }, [previousRound, hadDelegations])

  const allInfractions = useMemo((): ReportableInfraction[] => {
    const result: ReportableInfraction[] = []
    for (const round of rounds) {
      const { roundId, voteEnd, allocationStatus, proposals, reportDue, reportSubmitted } = round
      if (allocationStatus === "missed") result.push({ type: "missedAllocationVote", roundId })
      if (allocationStatus === "late") result.push({ type: "latePreferences", roundId, voteEnd })
      for (const p of proposals) {
        if (p.status === "missed") result.push({ type: "missedGovernanceVote", roundId, proposalId: p.proposalId })
      }
      if (reportDue && !reportSubmitted) result.push({ type: "missedReport", roundId })
    }
    return result
  }, [rounds])

  const { data: slashedSet } = useIsSlashedFor(address, allInfractions)

  const slashedByRound = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>()
    if (!slashedSet) return map
    allInfractions.forEach((inf, i) => {
      if (!slashedSet.has(i)) return
      const key = inf.type === "missedGovernanceVote" ? `proposal:${inf.proposalId}` : inf.type
      const roundMap = map.get(inf.roundId) ?? new Map<string, boolean>()
      roundMap.set(key, true)
      map.set(inf.roundId, roundMap)
    })
    return map
  }, [allInfractions, slashedSet])

  const stakeNum = stake ? Number(stake.scaled) : 0
  const penaltyAmount = slashBps != null ? (stakeNum * slashBps) / 10_000 : 0

  const visibleRounds = rounds.slice(0, visibleCount)
  const hasMore = visibleCount < rounds.length

  if (rounds.length === 0) return null

  return (
    <>
      <Card.Root variant="outline" borderRadius="xl">
        <Card.Body>
          <VStack gap={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">{t("Round History")}</Heading>
              {!isOwnPage && infractions.length > 0 && (
                <Button variant="outline" size="xs" colorPalette="red" onClick={() => setIsReportOpen(true)}>
                  <LuFlag />
                  {t("Report Navigator")}
                </Button>
              )}
            </HStack>

            <VStack gap={2} align="stretch">
              {visibleRounds.map(round => (
                <RoundCard
                  key={round.roundId}
                  round={round}
                  isExpanded={expandedRound === round.roundId}
                  onToggle={() => setExpandedRound(prev => (prev === round.roundId ? null : round.roundId))}
                  onViewReport={setViewReportURI}
                  slashedMap={slashedByRound.get(round.roundId)}
                  penaltyAmount={penaltyAmount}
                />
              ))}
            </VStack>

            {hasMore && (
              <Button
                variant="link"
                size="sm"
                fontWeight="semibold"
                onClick={() => setVisibleCount(prev => prev + PREVIEW_ROUNDS)}>
                {t("Show more")}
              </Button>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <ViewReportModal isOpen={!!viewReportURI} onClose={() => setViewReportURI(null)} reportURI={viewReportURI} />
      <ReportNavigatorModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        navigatorAddress={address}
        infractions={infractions}
      />
    </>
  )
}

const StatusBadge = ({ status }: { status: TaskStatus | "notDue" }) => {
  const { t } = useTranslation()

  const config = {
    done: { palette: "green", label: t("On Time") },
    late: { palette: "orange", label: t("Overdue") },
    missed: { palette: "red", label: t("Missed") },
    notDue: { palette: "gray", label: t("Not due") },
  }[status]

  return (
    <Badge colorPalette={config.palette} size="sm">
      {config.label}
    </Badge>
  )
}

const statusIcon = (status: TaskStatus | "notDue") => {
  if (status === "done") return <LuCheck />
  if (status === "missed") return <LuX />
  if (status === "late") return <LuCircle />
  return <LuCircle />
}

const statusColor = (status: TaskStatus | "notDue") => {
  if (status === "done") return "status.positive.primary"
  if (status === "missed") return "status.negative.primary"
  if (status === "late") return "status.warning.primary"
  return "text.subtle"
}

type RoundCardProps = {
  round: RoundCompliance
  isExpanded: boolean
  onToggle: () => void
  onViewReport: (uri: string) => void
  slashedMap?: Map<string, boolean>
  penaltyAmount: number
}

const RoundCard = ({ round, isExpanded, onToggle, onViewReport, slashedMap, penaltyAmount }: RoundCardProps) => {
  const { t } = useTranslation()

  const issueCount =
    (round.allocationStatus !== "done" ? 1 : 0) +
    round.proposals.filter(p => p.status !== "done").length +
    (round.reportDue && !round.reportSubmitted ? 1 : 0)

  const reportStatus: TaskStatus | "notDue" = round.reportSubmitted ? "done" : round.reportDue ? "missed" : "notDue"

  const isSlashed = (key: string) => slashedMap?.get(key) ?? false

  return (
    <VStack gap={0} borderRadius="lg" border="sm" borderColor="border.secondary" align="stretch">
      <HStack gap={3} p={3} cursor="pointer" _hover={{ bg: "bg.subtle" }} onClick={onToggle}>
        <Icon color="text.subtle">{isExpanded ? <LuChevronUp /> : <LuChevronDown />}</Icon>
        <Text textStyle="sm" fontWeight="semibold" flex={1}>
          {t("Round #{{round}}", { round: round.roundId })}
        </Text>
        {issueCount > 0 ? (
          <Badge colorPalette="red" size="sm">
            {issueCount} {issueCount === 1 ? t("issue") : t("issues")}
          </Badge>
        ) : (
          <Badge colorPalette="green" size="sm">
            {t("All good")}
          </Badge>
        )}
      </HStack>

      {isExpanded && (
        <VStack gap={1} px={3} pb={3} align="stretch">
          <TaskRow
            icon={<LuVote />}
            label={t("Allocation vote")}
            status={round.allocationStatus}
            slashed={isSlashed(round.allocationStatus === "missed" ? "missedAllocationVote" : "latePreferences")}
            penaltyAmount={penaltyAmount}
          />

          {round.proposals.map(p => (
            <TaskRow
              key={p.proposalId}
              icon={<LuGavel />}
              label={p.title}
              status={p.status}
              slashed={isSlashed(`proposal:${p.proposalId}`)}
              penaltyAmount={penaltyAmount}
            />
          ))}

          {(round.reportDue || round.reportSubmitted) && (
            <HStack gap={3} p={2} borderRadius="md">
              <Icon boxSize={4} color={statusColor(reportStatus)}>
                {statusIcon(reportStatus)}
              </Icon>
              <HStack gap={2} flex={1}>
                <Icon boxSize={4} color="text.subtle">
                  <LuFileText />
                </Icon>
                <Text textStyle="sm" fontWeight="medium">
                  {t("Report")}
                </Text>
              </HStack>
              {round.reportSubmitted && round.reportURI ? (
                <Button variant="ghost" size="xs" onClick={() => onViewReport(round.reportURI!)}>
                  <LuEye />
                  {t("View")}
                </Button>
              ) : isSlashed("missedReport") ? (
                <Badge colorPalette="purple" size="sm">
                  {t("Slashed")}
                  {" -"}
                  {formatter.format(penaltyAmount)}
                  {" B3TR"}
                </Badge>
              ) : (
                <StatusBadge status={reportStatus} />
              )}
            </HStack>
          )}
        </VStack>
      )}
    </VStack>
  )
}

type TaskRowProps = {
  icon: React.ReactNode
  label: string
  status: TaskStatus
  slashed?: boolean
  penaltyAmount?: number
}

const TaskRow = ({ icon, label, status, slashed, penaltyAmount }: TaskRowProps) => {
  const { t } = useTranslation()

  return (
    <HStack gap={3} p={2} borderRadius="md">
      <Icon boxSize={4} color={statusColor(status)}>
        {statusIcon(status)}
      </Icon>
      <HStack gap={2} flex={1}>
        <Icon boxSize={4} color="text.subtle">
          {icon}
        </Icon>
        <Text textStyle="sm" fontWeight="medium">
          {label}
        </Text>
      </HStack>
      {slashed && penaltyAmount ? (
        <Badge colorPalette="purple" size="sm">
          {t("Slashed")}
          {" -"}
          {formatter.format(penaltyAmount)}
          {" B3TR"}
        </Badge>
      ) : (
        <StatusBadge status={status} />
      )}
    </HStack>
  )
}
