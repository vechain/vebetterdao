import { Badge, Card, Heading, HStack, Icon, IconButton, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"
import { LuCheck, LuCircle, LuClock, LuFileText, LuGavel, LuInfo, LuTriangleAlert, LuVote } from "react-icons/lu"

import { useGetLastReportRound } from "@/api/contracts/navigatorRegistry/hooks/useGetLastReportRound"
import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { useHasSetDecisions } from "@/api/contracts/navigatorRegistry/hooks/useHasSetDecisions"
import { useHasSetPreferences } from "@/api/contracts/navigatorRegistry/hooks/useHasSetPreferences"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useNavigatorCutoffDeadline } from "@/hooks/navigator/useNavigatorCutoffDeadline"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { NavigatorTasksInfoModal } from "./modals/NavigatorTasksInfoModal"

type Props = {
  onSubmitReport: () => void
}

export const NavigatorTaskList = ({ onSubmitReport }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: hasSetPrefs } = useHasSetPreferences(roundId)
  const { data: lastReportRound } = useGetLastReportRound()
  const { data: reportInterval } = useGetReportInterval()
  const { cutoffDate, isPastCutoff } = useNavigatorCutoffDeadline()

  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()

  const activeProposals = useMemo(
    () => enrichedProposals.filter(p => p.state === ProposalState.Active),
    [enrichedProposals],
  )

  const activeProposalIds = useMemo(() => activeProposals.map(p => p.id), [activeProposals])
  const { data: decisionsMap } = useHasSetDecisions(activeProposalIds)

  const currentRound = Number(roundId ?? 0)
  const isReportDue =
    reportInterval != null && lastReportRound != null && currentRound > 0
      ? currentRound - lastReportRound >= reportInterval
      : false

  const hasUnvotedProposals = activeProposals.some(p => !decisionsMap?.[p.id])
  const hasPendingTasks = !hasSetPrefs || isReportDue || hasUnvotedProposals

  if (!roundId) return null

  return (
    <Card.Root variant="outline" borderRadius="xl">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <HStack gap={2}>
              <Heading size="md">{t("Navigator Tasks")}</Heading>
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
              done={!isReportDue}
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
  icon: React.ReactNode
  label: string
  doneLabel: string
  pendingLabel: string
  onClick: () => void
}

const TaskItem = ({ done, overdue, icon, label, doneLabel, pendingLabel, onClick }: TaskItemProps) => {
  const palette = done ? "green" : overdue ? "red" : "orange"

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
      <Badge colorPalette={palette} size="sm">
        {done ? doneLabel : pendingLabel}
      </Badge>
    </HStack>
  )
}
