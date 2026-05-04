import { Badge, Button, Card, Heading, HStack, Icon, IconButton, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"
import {
  LuCheck,
  LuCircle,
  LuClock,
  LuCoins,
  LuEye,
  LuFileText,
  LuGavel,
  LuInfo,
  LuPencil,
  LuTriangleAlert,
  LuVote,
} from "react-icons/lu"

import { useGetLastReportRound } from "@/api/contracts/navigatorRegistry/hooks/useGetLastReportRound"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { useGetPreferenceCutoffPeriod } from "@/api/contracts/navigatorRegistry/hooks/useGetPreferenceCutoffPeriod"
import { useGetPreferencesSetBlock } from "@/api/contracts/navigatorRegistry/hooks/useGetPreferencesSetBlock"
import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useGetStakedAmountAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetStakedAmountAtTimepoint"
import { useHasSetDecisions } from "@/api/contracts/navigatorRegistry/hooks/useHasSetDecisions"
import { useHasSetPreferences } from "@/api/contracts/navigatorRegistry/hooks/useHasSetPreferences"
import { useNavigatorReportEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorReportEvents"
import { useCurrentAllocationsRoundDeadline } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundDeadline"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useCurrentRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useCurrentRoundSnapshot"
import { useIsNavigatorRegistrationRound } from "@/hooks/navigator/useIsNavigatorRegistrationRound"
import { useNavigatorCutoffDeadline } from "@/hooks/navigator/useNavigatorCutoffDeadline"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { NavigatorTasksInfoModal } from "./modals/NavigatorTasksInfoModal"
import { ViewReportModal } from "./modals/ViewReportModal"

type Props = {
  address: string
  onSubmitReport: () => void
  onManageStakeClick: () => void
}

export const NavigatorTaskList = ({ address, onSubmitReport, onManageStakeClick }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [viewReportURI, setViewReportURI] = useState<string | null>(null)
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: hasSetPrefs } = useHasSetPreferences(roundId)
  const { data: prefsSetBlock } = useGetPreferencesSetBlock(roundId)
  const { data: roundDeadlineBlock } = useCurrentAllocationsRoundDeadline()
  const { data: preferenceCutoffPeriod } = useGetPreferenceCutoffPeriod()
  const { data: lastReportRound } = useGetLastReportRound()
  const { data: reportInterval } = useGetReportInterval()
  const { data: reportEvents } = useNavigatorReportEvents(address)
  const { data: minStakeData } = useGetMinStake()
  const { data: stakeData } = useGetStake(address)
  const { data: snapshot } = useCurrentRoundSnapshot()
  const { data: stakeAtSnapshot } = useGetStakedAmountAtTimepoint(address, snapshot ?? undefined)
  const { cutoffDate, isPastCutoff } = useNavigatorCutoffDeadline()
  const isRegistrationRound = useIsNavigatorRegistrationRound(address)
  // Show stake task only if navigator was below min at round start
  const wasBelowMinAtRoundStart =
    minStakeData && stakeAtSnapshot ? stakeAtSnapshot.raw > 0n && stakeAtSnapshot.raw < minStakeData.raw : false
  const isBelowMinStake = minStakeData && stakeData ? stakeData.raw < minStakeData.raw : false

  const preferenceCutoffBlock = useMemo(() => {
    if (roundDeadlineBlock == null || preferenceCutoffPeriod == null) return null
    const deadline = BigInt(roundDeadlineBlock)
    const period = BigInt(preferenceCutoffPeriod)
    return deadline > period ? deadline - period : 0n
  }, [roundDeadlineBlock, preferenceCutoffPeriod])

  const isPreferencesSetLate =
    !!hasSetPrefs && prefsSetBlock != null && preferenceCutoffBlock != null && prefsSetBlock > preferenceCutoffBlock

  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()

  const activeProposals = useMemo(
    () => enrichedProposals.filter(p => p.state === ProposalState.Active),
    [enrichedProposals],
  )

  const activeProposalIds = useMemo(() => activeProposals.map(p => p.id), [activeProposals])
  const { data: decisionsMap } = useHasSetDecisions(activeProposalIds)

  const currentRound = Number(roundId ?? 0)
  const lastReport = lastReportRound ?? 0
  const hasReportThisRound = currentRound > 0 && lastReport === currentRound
  const isReportMandatory =
    reportInterval != null && reportInterval > 0 && currentRound > 0
      ? currentRound >= lastReport + reportInterval
      : false

  const hasUnvotedProposals = activeProposals.some(p => !decisionsMap?.[p.id])
  const hasPendingTasks =
    !hasSetPrefs ||
    (isReportMandatory && !hasReportThisRound) ||
    hasUnvotedProposals ||
    (wasBelowMinAtRoundStart && isBelowMinStake)

  const currentRoundReportURI = useMemo(() => {
    if (!roundId) return undefined
    // Events are ascending; pick the latest matching one so re-submissions overwrite older entries.
    return reportEvents?.findLast(ev => ev.roundId === roundId)?.reportURI
  }, [reportEvents, roundId])

  if (!roundId) return null

  if (isRegistrationRound) {
    return (
      <Card.Root variant="outline" borderRadius="xl" w="full">
        <Card.Body>
          <VStack gap={6} align="stretch">
            <HStack gap={2}>
              <Heading size={{ base: "sm", md: "md" }}>{t("Your Tasks")}</Heading>
            </HStack>
            <HStack gap={2} p={3} borderRadius="lg" bg="status.neutral.subtle">
              <Icon color="status.neutral.primary">
                <LuInfo />
              </Icon>
              <Text textStyle="sm">
                {t(
                  "Currently you do not have any tasks to complete. You will see here your tasks starting from the next round.",
                )}
              </Text>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <Card.Root variant="outline" borderRadius="xl" w="full">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <HStack gap={2}>
              <Heading size={{ base: "sm", md: "md" }}>{t("Your Tasks")}</Heading>
              <IconButton
                variant="ghost"
                size="xs"
                rounded="full"
                aria-label="Info"
                onClick={() => setIsInfoOpen(true)}>
                <LuInfo />
              </IconButton>
            </HStack>
          </HStack>

          {cutoffDate && hasPendingTasks && (
            <HStack
              gap={2}
              p={3}
              borderRadius="lg"
              bg={isPastCutoff ? "status.negative.subtle" : "status.warning.subtle"}>
              <Icon color={isPastCutoff ? "status.negative.primary" : "status.warning.primary"}>
                {isPastCutoff ? <LuTriangleAlert /> : <LuClock />}
              </Icon>
              <Text textStyle="sm" fontWeight="semibold">
                {isPastCutoff ? (
                  t("Cutoff Expired")
                ) : (
                  <HStack gap={1} as="span">
                    <Text as="span">{t("Cutoff in")}</Text>
                    <Countdown
                      date={cutoffDate}
                      renderer={({ days, hours, minutes }) => (
                        <Text as="span" fontWeight="bold">
                          {days > 0 && `${days}d `}
                          {hours}
                          {"h "}
                          {minutes}
                          {"m"}
                        </Text>
                      )}
                    />
                  </HStack>
                )}
              </Text>
            </HStack>
          )}

          <VStack gap={2} align="stretch">
            <TaskItem
              done={!!hasSetPrefs}
              overdue={!hasSetPrefs && isPastCutoff}
              showOverdueWhenDone={isPreferencesSetLate}
              icon={<LuVote />}
              label={t("Set allocation preferences")}
              doneLabel={t("Preferences Set")}
              pendingLabel={t("Preferences Pending")}
              onClick={() => router.push("/allocations/vote")}
            />

            {activeProposals.map(proposal => (
              <TaskItem
                key={proposal.id}
                done={!!decisionsMap?.[proposal.id]}
                icon={<LuGavel />}
                label={proposal.title}
                doneLabel={t("Decision Set")}
                pendingLabel={t("Decision Pending")}
                onClick={() => router.push(`/proposals/${proposal.id}`)}
              />
            ))}

            {wasBelowMinAtRoundStart && (
              <TaskItem
                done={!isBelowMinStake}
                overdue={isBelowMinStake}
                icon={<LuCoins />}
                label={isBelowMinStake ? t("Stake below minimum") : t("Stake above minimum")}
                doneLabel={t("Stake OK")}
                pendingLabel={t("Action Required")}
                onClick={isBelowMinStake ? onManageStakeClick : undefined}
              />
            )}

            <TaskItem
              done={hasReportThisRound}
              softPending={!hasReportThisRound && !isReportMandatory}
              icon={<LuFileText />}
              label={t("Submit Report")}
              doneLabel={t("Report Submitted")}
              pendingLabel={t("Report Due")}
              onClick={onSubmitReport}
              doneAction={
                hasReportThisRound && currentRoundReportURI ? (
                  <HStack gap={1}>
                    <Button variant="ghost" size="xs" onClick={() => setViewReportURI(currentRoundReportURI)}>
                      <LuEye />
                      {t("View")}
                    </Button>
                    <Button variant="ghost" size="xs" onClick={onSubmitReport}>
                      <LuPencil />
                      {t("Edit")}
                    </Button>
                  </HStack>
                ) : undefined
              }
            />
          </VStack>
        </VStack>
      </Card.Body>

      <NavigatorTasksInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      <ViewReportModal isOpen={!!viewReportURI} onClose={() => setViewReportURI(null)} reportURI={viewReportURI} />
    </Card.Root>
  )
}

type TaskItemProps = {
  done: boolean
  overdue?: boolean
  /** Preferences (or similar) completed after on-chain cutoff — orange "Overdue" like Round history */
  showOverdueWhenDone?: boolean
  /** Report optional this round: gray badge, still clickable */
  softPending?: boolean
  icon: React.ReactNode
  label: string
  doneLabel: string
  pendingLabel: string
  onClick: () => void
  /** Optional action shown instead of the done badge (e.g. View report) */
  doneAction?: React.ReactNode
}

const TaskItem = ({
  done,
  overdue,
  showOverdueWhenDone,
  softPending,
  icon,
  label,
  doneLabel,
  pendingLabel,
  onClick,
  doneAction,
}: TaskItemProps) => {
  const { t } = useTranslation()
  const palette = done ? "green" : softPending ? "gray" : overdue ? "red" : "orange"
  const pendingBadgeLabel = softPending ? t("Optional") : pendingLabel
  const showDoneAction = done && !!doneAction

  return (
    <HStack
      gap={3}
      p={3}
      borderRadius="lg"
      border="sm"
      borderColor="border.secondary"
      cursor={done ? "default" : "pointer"}
      _hover={done ? undefined : { bg: "bg.subtle" }}
      onClick={done ? undefined : onClick}>
      <Icon color={done ? "status.positive.primary" : "text.subtle"}>{done ? <LuCheck /> : <LuCircle />}</Icon>
      <HStack gap={2} flex={1}>
        <Icon color="text.subtle">{icon}</Icon>
        <Text textStyle="sm" fontWeight="medium">
          {label}
        </Text>
      </HStack>
      <HStack gap={1} flexShrink={0}>
        {showDoneAction ? (
          doneAction
        ) : (
          <Badge colorPalette={palette} size="sm">
            {done ? doneLabel : pendingBadgeLabel}
          </Badge>
        )}
        {done && showOverdueWhenDone && (
          <Badge colorPalette="orange" size="sm">
            {t("Overdue")}
          </Badge>
        )}
      </HStack>
    </HStack>
  )
}
