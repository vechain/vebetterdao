import {
  Badge,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Separator,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { LuClock, LuCoins, LuFileText, LuGavel, LuTriangleAlert, LuUsers, LuVote } from "react-icons/lu"

import { useGetLastReportRound } from "@/api/contracts/navigatorRegistry/hooks/useGetLastReportRound"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useGetStakedAmountAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetStakedAmountAtTimepoint"
import { useGetTotalDelegatedAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetTotalDelegatedAtTimepoint"
import { useHasSetDecisions } from "@/api/contracts/navigatorRegistry/hooks/useHasSetDecisions"
import { useHasSetPreferences } from "@/api/contracts/navigatorRegistry/hooks/useHasSetPreferences"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { useNavigatorReportEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorReportEvents"
import {
  type NavigatorStatusValue,
  useNavigatorStatus,
} from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useCurrentRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useCurrentRoundSnapshot"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { useIsNavigatorRegistrationRound } from "@/hooks/navigator/useIsNavigatorRegistrationRound"
import { useNavigatorCutoffDeadline } from "@/hooks/navigator/useNavigatorCutoffDeadline"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { ViewReportModal } from "../navigators/[address]/components/modals/ViewReportModal"
import { TaskRow } from "../navigators/[address]/components/NavigatorRoundHistory/TaskRow"
import { type ReportRowStatus } from "../navigators/[address]/components/NavigatorRoundHistory/types"

const formatter = getCompactFormatter(2)

const statusColor: Record<NavigatorStatusValue, string> = {
  NONE: "gray",
  ACTIVE: "green",
  EXITING: "yellow",
  DEACTIVATED: "red",
}

export const NavigatorDashboardCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data: isNavigator } = useIsNavigator()
  const { data: status } = useNavigatorStatus()
  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(account?.address ?? "")
  const { data: snapshot } = useCurrentRoundSnapshot()
  const { data: delegatedAtSnapshot } = useGetTotalDelegatedAtTimepoint(account?.address ?? "", snapshot ?? undefined)
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: hasSetPrefs } = useHasSetPreferences(roundId)
  const { data: lastReportRound } = useGetLastReportRound()
  const { data: reportInterval } = useGetReportInterval()
  const { cutoffDate, isPastCutoff } = useNavigatorCutoffDeadline()
  const isRegistrationRound = useIsNavigatorRegistrationRound(account?.address)
  const { data: minStakeData } = useGetMinStake()
  const { data: stakeData } = useGetStake(account?.address ?? "")
  const { data: stakeAtSnapshot } = useGetStakedAmountAtTimepoint(account?.address ?? "", snapshot ?? undefined)
  const isBelowMinStake = minStakeData && stakeData ? stakeData.raw < minStakeData.raw : false
  const wasBelowMinAtRoundStart =
    minStakeData && stakeAtSnapshot ? stakeAtSnapshot.raw > 0n && stakeAtSnapshot.raw < minStakeData.raw : false
  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const { data: reportEvents } = useNavigatorReportEvents(account?.address)

  const currentRoundReportURI = useMemo(() => {
    if (!reportEvents || !roundId) return undefined
    return reportEvents.find(e => e.roundId === roundId)?.reportURI
  }, [reportEvents, roundId])

  const [isViewReportOpen, setIsViewReportOpen] = useState(false)

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

  const delegationChange = useMemo(() => {
    if (!nav || !delegatedAtSnapshot) return null
    const prev = Number(delegatedAtSnapshot.scaled)
    const curr = Number(nav.totalDelegatedFormatted)
    if (prev === 0) return curr > 0 ? 100 : null
    return ((curr - prev) / prev) * 100
  }, [nav, delegatedAtSnapshot])

  if (!isNavigator || !account?.address) return null
  if (status === "DEACTIVATED" && Number(nav?.stakeFormatted ?? 0) === 0) return null

  const staked = formatter.format(Number(nav?.stakeFormatted ?? 0))
  const delegated = formatter.format(Number(nav?.totalDelegatedFormatted ?? 0))
  const capacity = formatter.format(Number(nav?.stakeFormatted ?? 0) * 10)
  const citizens = nav?.citizenCount ?? 0

  const showTasks = (status === "ACTIVE" || status === "EXITING") && !isRegistrationRound

  const allProposalsDone = activeProposals.length === 0 || activeProposals.every(p => decisionsMap?.[p.id])
  const proposalsDoneCount = activeProposals.filter(p => decisionsMap?.[p.id]).length
  const hasPendingTasks =
    !hasSetPrefs ||
    !allProposalsDone ||
    (isReportMandatory && !hasReportThisRound) ||
    (wasBelowMinAtRoundStart && isBelowMinStake)

  const allocationStatus = hasSetPrefs ? "done" : "pending"
  const reportStatus: ReportRowStatus = hasReportThisRound ? "done" : isReportMandatory ? "pending" : "optionalOpen"

  return (
    <>
      <Card.Root w="full" variant="primary">
        <Card.Body>
          <VStack gap={4} align="stretch">
            <HStack justify="space-between">
              <HStack gap={2}>
                <Heading size="xl">{t("Navigator Tasks")}</Heading>
                {(status === "EXITING" || status === "DEACTIVATED") && (
                  <Badge colorPalette={statusColor[status]} size="sm">
                    {status}
                  </Badge>
                )}
              </HStack>
              <IconButton
                rounded="full"
                variant="surface"
                aria-label={t("Go to Navigator")}
                width="6"
                onClick={() => router.push(`/navigators/${account.address}`)}>
                <FiArrowUpRight />
              </IconButton>
            </HStack>

            <Skeleton loading={navLoading}>
              <HStack gap={4} flexWrap="wrap">
                <HStack gap={1}>
                  <Image aspectRatio="square" w="5" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
                  <Text textStyle="md" fontWeight="semibold">
                    {staked}
                  </Text>
                  <Text textStyle="xs" color="text.subtle">
                    {t("Stake")}
                  </Text>
                </HStack>

                <HStack gap={1}>
                  <Icon boxSize={3} color="text.subtle">
                    <LuUsers />
                  </Icon>
                  <Text textStyle="md" fontWeight="semibold">
                    {citizens}
                  </Text>
                  <Text textStyle="xs" color="text.subtle">
                    {t("citizens")}
                  </Text>
                </HStack>
              </HStack>
            </Skeleton>

            <Skeleton loading={navLoading}>
              <HStack justify="space-between">
                <Text textStyle="xs" color="text.subtle">
                  {`${delegated} ${t("VOT3")} ${t("delegated")} (${t("cap")}: ${capacity})`}
                </Text>
                {delegationChange !== null && (
                  <Text
                    textStyle="xs"
                    fontWeight="semibold"
                    color={delegationChange >= 0 ? "status.positive.primary" : "status.negative.primary"}>
                    {delegationChange >= 0 ? "+" : ""}
                    {formatter.format(delegationChange)}
                    {"%"}
                  </Text>
                )}
              </HStack>
            </Skeleton>

            {(status === "ACTIVE" || status === "EXITING") && isRegistrationRound && (
              <HStack gap={2} p={2} borderRadius="md" bg="bg.subtle">
                <Icon boxSize={4} color="text.subtle">
                  <LuClock />
                </Icon>
                <Text textStyle="xs" color="text.subtle">
                  {t("Currently you do not have any tasks to complete. Your tasks will begin next round.")}
                </Text>
              </HStack>
            )}

            {showTasks && (
              <>
                <Separator />

                {cutoffDate && hasPendingTasks && (
                  <HStack
                    gap={2}
                    p={2}
                    borderRadius="md"
                    bg={isPastCutoff ? "status.negative.subtle" : "status.warning.subtle"}>
                    <Icon boxSize={4} color={isPastCutoff ? "status.negative.primary" : "status.warning.primary"}>
                      {isPastCutoff ? <LuTriangleAlert /> : <LuClock />}
                    </Icon>
                    <Text
                      textStyle="xs"
                      color={isPastCutoff ? "status.negative.primary" : "text.subtle"}
                      fontWeight="medium">
                      {isPastCutoff ? (
                        t("Cutoff Expired")
                      ) : (
                        <>
                          {t("Cutoff in")}{" "}
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
                        </>
                      )}
                    </Text>
                  </HStack>
                )}

                <VStack gap={1} align="stretch">
                  <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                    {t("Round #{{round}}", { round: currentRound })}
                  </Text>

                  <TaskRow
                    icon={<LuVote />}
                    label={hasSetPrefs ? t("Voted For Apps") : t("Vote For Apps")}
                    status={allocationStatus}
                  />

                  {activeProposals.length > 0 && (
                    <TaskRow
                      icon={<LuGavel />}
                      label={
                        allProposalsDone
                          ? t("All proposals voted")
                          : `${proposalsDoneCount}/${activeProposals.length} ${t("Proposals")}`
                      }
                      status={allProposalsDone ? "done" : "pending"}
                    />
                  )}

                  <TaskRow
                    icon={<LuFileText />}
                    label={
                      hasReportThisRound
                        ? t("Report Submitted")
                        : isReportMandatory
                          ? t("Report Due")
                          : t("Report optional")
                    }
                    status={reportStatus}
                    onClick={hasReportThisRound || currentRoundReportURI ? () => setIsViewReportOpen(true) : undefined}
                  />

                  {wasBelowMinAtRoundStart && (
                    <TaskRow
                      icon={<LuCoins />}
                      label={isBelowMinStake ? t("Stake below minimum") : t("Stake above minimum")}
                      status={isBelowMinStake ? "pending" : "done"}
                    />
                  )}
                </VStack>
              </>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <ViewReportModal
        isOpen={isViewReportOpen}
        onClose={() => setIsViewReportOpen(false)}
        reportURI={currentRoundReportURI ?? null}
      />
    </>
  )
}
