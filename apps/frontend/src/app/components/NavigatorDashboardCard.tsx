import { Badge, Card, Heading, HStack, Icon, IconButton, Image, Skeleton, Stat, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { LuCheck, LuCircle, LuClock, LuTriangleAlert } from "react-icons/lu"

import { useGetLastReportRound } from "@/api/contracts/navigatorRegistry/hooks/useGetLastReportRound"
import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { useGetTotalDelegatedAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetTotalDelegatedAtTimepoint"
import { useHasSetDecisions } from "@/api/contracts/navigatorRegistry/hooks/useHasSetDecisions"
import { useHasSetPreferences } from "@/api/contracts/navigatorRegistry/hooks/useHasSetPreferences"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import {
  type NavigatorStatusValue,
  useNavigatorStatus,
} from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useCurrentRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useCurrentRoundSnapshot"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { useNavigatorCutoffDeadline } from "@/hooks/navigator/useNavigatorCutoffDeadline"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"

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

  const delegationChange = useMemo(() => {
    if (!nav || !delegatedAtSnapshot) return null
    const prev = Number(delegatedAtSnapshot.scaled)
    const curr = Number(nav.totalDelegatedFormatted)
    if (prev === 0) return curr > 0 ? 100 : null
    return ((curr - prev) / prev) * 100
  }, [nav, delegatedAtSnapshot])

  if (!isNavigator || !account?.address) return null
  if (status === "DEACTIVATED" && Number(nav?.stakeFormatted ?? 0) === 0) return null

  const capacity = formatter.format(Number(nav?.stakeFormatted ?? 0) * 10)
  const delegated = formatter.format(Number(nav?.totalDelegatedFormatted ?? 0))
  const staked = formatter.format(Number(nav?.stakeFormatted ?? 0))
  const citizens = nav?.citizenCount ?? 0

  return (
    <Card.Root w="full" variant="primary">
      <Card.Body>
        <VStack gap="4" align="flex-start" w="full">
          <HStack justifyContent="space-between" w="full">
            <HStack gap={2}>
              <Heading size="xl">{t("Navigator")}</Heading>
              {(status === "EXITING" || status === "DEACTIVATED") && (
                <Badge colorPalette={statusColor[status]} size="sm">
                  {status}
                </Badge>
              )}
            </HStack>

            <IconButton
              rounded="full"
              variant="surface"
              aria-label="Go to Navigator"
              width="6"
              onClick={() => router.push(`/navigators/${account.address}`)}>
              <FiArrowUpRight />
            </IconButton>
          </HStack>

          <VStack gap="4" w="full" align="flex-start">
            <Skeleton loading={navLoading} w="full">
              <Stat.Root>
                <Stat.Label>{t("Total Staked")}</Stat.Label>
                <Stat.ValueText>
                  <HStack>
                    <Image aspectRatio="square" w="6" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
                    <Heading size="2xl" color="text.default">
                      {staked}
                    </Heading>
                  </HStack>
                </Stat.ValueText>
              </Stat.Root>
            </Skeleton>

            <Skeleton loading={navLoading} w="full">
              <Stat.Root>
                <Stat.Label>{t("Delegated")}</Stat.Label>
                <HStack alignItems="center" justifyContent="space-between">
                  <Stat.ValueText textStyle="md">
                    {`${delegated} ${t("VOT3")} (${t("cap")}: ${capacity})`}
                  </Stat.ValueText>
                  {delegationChange !== null && (
                    <Stat.HelpText
                      color={delegationChange >= 0 ? "status.positive.primary" : "status.negative.primary"}>
                      {delegationChange >= 0 ? "+" : ""}
                      {formatter.format(delegationChange)}
                      {"% than "}
                      {t("round start")}
                    </Stat.HelpText>
                  )}
                </HStack>
              </Stat.Root>
            </Skeleton>

            <Skeleton loading={navLoading} w="full">
              <Stat.Root>
                <Stat.Label>{t("Citizens")}</Stat.Label>
                <Stat.ValueText textStyle="md">{citizens}</Stat.ValueText>
              </Stat.Root>
            </Skeleton>

            {(status === "ACTIVE" || status === "EXITING") && (
              <VStack gap={2} w="full" align="stretch" pt={2} borderTop="1px solid" borderColor="border.secondary">
                {cutoffDate && hasPendingTasks && (
                  <HStack gap={1}>
                    <Icon boxSize={3} color={isPastCutoff ? "status.negative.primary" : "status.warning.primary"}>
                      {isPastCutoff ? <LuTriangleAlert /> : <LuClock />}
                    </Icon>
                    <Text textStyle="xs" color={isPastCutoff ? "status.negative.primary" : "text.subtle"}>
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

                <HStack gap={2} flexWrap="wrap">
                  <HStack gap={1}>
                    <Icon boxSize={3} color={hasSetPrefs ? "status.positive.primary" : "status.warning.primary"}>
                      {hasSetPrefs ? <LuCheck /> : <LuCircle />}
                    </Icon>
                    <Text textStyle="xs">{hasSetPrefs ? t("Preferences Set") : t("Preferences Pending")}</Text>
                  </HStack>
                  {activeProposals.length > 0 && (
                    <HStack gap={1}>
                      <Icon
                        boxSize={3}
                        color={
                          activeProposals.every(p => decisionsMap?.[p.id])
                            ? "status.positive.primary"
                            : "status.warning.primary"
                        }>
                        {activeProposals.every(p => decisionsMap?.[p.id]) ? <LuCheck /> : <LuCircle />}
                      </Icon>
                      <Text textStyle="xs">
                        {t("Proposals")}{" "}
                        {`${activeProposals.filter(p => decisionsMap?.[p.id]).length}/${activeProposals.length}`}
                      </Text>
                    </HStack>
                  )}
                  <HStack gap={1}>
                    <Icon
                      boxSize={3}
                      color={
                        hasReportThisRound
                          ? "status.positive.primary"
                          : isReportMandatory
                            ? "status.warning.primary"
                            : "text.subtle"
                      }>
                      {hasReportThisRound ? <LuCheck /> : <LuCircle />}
                    </Icon>
                    <Text textStyle="xs">
                      {hasReportThisRound ? t("Report Submitted") : isReportMandatory ? t("Report Due") : t("Optional")}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
