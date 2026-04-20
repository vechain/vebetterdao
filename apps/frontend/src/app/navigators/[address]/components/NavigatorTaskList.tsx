import { Badge, Card, Heading, HStack, Icon, IconButton, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"
import { LuCheck, LuCircle, LuClock, LuFileText, LuGavel, LuInfo, LuTriangleAlert, LuVote } from "react-icons/lu"

import { useGetLastReportRound } from "@/api/contracts/navigatorRegistry/hooks/useGetLastReportRound"
import { useGetPreferenceCutoffPeriod } from "@/api/contracts/navigatorRegistry/hooks/useGetPreferenceCutoffPeriod"
import { useGetPreferencesSetBlock } from "@/api/contracts/navigatorRegistry/hooks/useGetPreferencesSetBlock"
import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { useHasSetDecisions } from "@/api/contracts/navigatorRegistry/hooks/useHasSetDecisions"
import { useHasSetPreferences } from "@/api/contracts/navigatorRegistry/hooks/useHasSetPreferences"
import { useAllocationsRoundsEvents } from "@/api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useCurrentAllocationsRoundDeadline } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundDeadline"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useNavigatorCutoffDeadline } from "@/hooks/navigator/useNavigatorCutoffDeadline"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { useEvents } from "@/hooks/useEvents"

import { NavigatorTasksInfoModal } from "./modals/NavigatorTasksInfoModal"

type Props = {
  address: string
  onSubmitReport: () => void
}

export const NavigatorTaskList = ({ address, onSubmitReport }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: hasSetPrefs } = useHasSetPreferences(roundId)
  const { data: prefsSetBlock } = useGetPreferencesSetBlock(roundId)
  const { data: roundDeadlineBlock } = useCurrentAllocationsRoundDeadline()
  const { data: preferenceCutoffPeriod } = useGetPreferenceCutoffPeriod()
  const { data: lastReportRound } = useGetLastReportRound()
  const { data: reportInterval } = useGetReportInterval()
  const { cutoffDate, isPastCutoff } = useNavigatorCutoffDeadline()

  // Detect if navigator registered mid-round — tasks begin the round after registration
  const { data: roundsData } = useAllocationsRoundsEvents()
  const { data: regBlockData } = useEvents({
    contractAddress: getConfig().navigatorRegistryContractAddress,
    abi: NavigatorRegistry__factory.abi,
    eventName: "NavigatorRegistered",
    filterParams: { navigator: address as `0x${string}` },
    select: events => events[0]?.meta.blockNumber ?? 0,
  })
  const registrationBlock = regBlockData ?? 0

  const isRegistrationRound = useMemo(() => {
    if (!registrationBlock || !roundsData?.created?.length || !roundId) return false
    const currentRound = roundsData.created.find(r => r.roundId === roundId)
    if (!currentRound) return false
    return registrationBlock > Number(currentRound.voteStart)
  }, [registrationBlock, roundsData, roundId])

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
  const hasPendingTasks = !hasSetPrefs || (isReportMandatory && !hasReportThisRound) || hasUnvotedProposals

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
                {t("Currently you do not have any tasks to complete. Your tasks will begin next round.")}
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
            {hasPendingTasks && (
              <Badge colorPalette="orange" size="sm">
                {t("Actions required this round")}
              </Badge>
            )}
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

            <TaskItem
              done={hasReportThisRound}
              softPending={!hasReportThisRound && !isReportMandatory}
              icon={<LuFileText />}
              label={t("Submit Report")}
              doneLabel={t("Report Submitted")}
              pendingLabel={t("Report Due")}
              onClick={onSubmitReport}
            />
          </VStack>
        </VStack>
      </Card.Body>

      <NavigatorTasksInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
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
}: TaskItemProps) => {
  const { t } = useTranslation()
  const palette = done ? "green" : softPending ? "gray" : overdue ? "red" : "orange"
  const pendingBadgeLabel = softPending ? t("Optional") : pendingLabel

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
        <Badge colorPalette={palette} size="sm">
          {done ? doneLabel : pendingBadgeLabel}
        </Badge>
        {done && showOverdueWhenDone && (
          <Badge colorPalette="orange" size="sm">
            {t("Overdue")}
          </Badge>
        )}
      </HStack>
    </HStack>
  )
}
