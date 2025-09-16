import { useProposalInteractionDates } from "@/api"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useBreakpoints, useProposalEnrichedById } from "@/hooks"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { Grid, GridItem, Skeleton, Tabs, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import { ProposalInteractionCard } from "./ProposalInteractionCard"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalTimeline } from "./ProposalTimeline"
import { ProposalVoteCommentList } from "./ProposalVoteCommentList/ProposalVoteCommentList"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposal, isLoading } = useProposalEnrichedById(proposalId)

  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposalId)
  const { isMobile } = useBreakpoints()
  const { t } = useTranslation()

  const isGrant = useMemo(() => {
    return proposal?.type === ProposalType.Grant
  }, [proposal])

  const BreadcrumItems = [
    {
      label: isGrant ? "Grants" : "Proposals",
      href: isGrant ? "/proposals/grants" : "/proposals",
    },
    {
      label: "Overview",
      href: `/proposals/${proposalId}`,
    },
  ]

  const isVotingPhase = proposal?.state === ProposalState.Active
  const targetDate = isVotingPhase ? votingEndDate : supportEndDate

  // Throttle countdown calculations to reduce re-renders
  const lastCountdownCalculationRef = useRef<{
    targetDate: number
    timestamp: number
    result: { daysLeft: number; hoursLeft: number; minutesLeft: number }
  } | null>(null)

  const { daysLeft, hoursLeft, minutesLeft } = useMemo(() => {
    if (!targetDate) return { daysLeft: 0, hoursLeft: 0, minutesLeft: 0 }

    const now = Date.now()

    // Throttle calculations - only recalculate every 30 seconds to reduce excessive re-renders
    if (
      lastCountdownCalculationRef.current &&
      lastCountdownCalculationRef.current.targetDate === targetDate &&
      now - lastCountdownCalculationRef.current.timestamp < 30000 // 30 seconds
    ) {
      return lastCountdownCalculationRef.current.result
    }

    const nowDayjs = dayjs()
    const target = dayjs(targetDate)

    // Only calculate if target is in the future
    if (target.isBefore(nowDayjs)) {
      const result = { daysLeft: 0, hoursLeft: 0, minutesLeft: 0 }
      lastCountdownCalculationRef.current = { targetDate, timestamp: now, result }
      return result
    }

    const daysLeft = target.diff(nowDayjs, "days")
    const hoursLeft = target.diff(nowDayjs, "hours") % 24
    const minutesLeft = target.diff(nowDayjs, "minutes") % 60

    const result = {
      daysLeft: Math.max(0, daysLeft),
      hoursLeft: Math.max(0, hoursLeft),
      minutesLeft: Math.max(0, minutesLeft),
    }

    // Cache the result
    lastCountdownCalculationRef.current = { targetDate, timestamp: now, result }

    return result
  }, [targetDate])

  // Memoize heavy child components to prevent unnecessary re-renders
  const memoizedProposalInteractionCard = useMemo(
    () => (
      <ProposalInteractionCard
        proposal={proposal}
        isVotingPhase={isVotingPhase}
        daysLeft={daysLeft}
        hoursLeft={hoursLeft}
        minutesLeft={minutesLeft}
        isLoading={isLoading}
      />
    ),
    [proposal, isVotingPhase, daysLeft, hoursLeft, minutesLeft, isLoading],
  )

  const memoizedProposalTimeline = useMemo(() => <ProposalTimeline proposal={proposal} />, [proposal])

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <PageBreadcrumb items={BreadcrumItems} />

      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} order={[2, 2, 1]}>
          <Skeleton loading={isLoading}>
            <ProposalOverview isGrant={isGrant} proposal={proposal} />
          </Skeleton>
        </GridItem>
        <GridItem colSpan={[3, 3, 1]} order={[1, 1, 2]}>
          <VStack align="stretch" gap={8}>
            {isMobile ? (
              <Tabs.Root defaultValue="session" w="full" colorPalette="blue" fitted>
                <Tabs.List>
                  <Tabs.Trigger
                    value="session"
                    color="text"
                    fontWeight="400"
                    _selected={{
                      color: "#004CFC",
                      fontWeight: "800",
                    }}>
                    {t("Session")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="timeline"
                    color="text.subtle"
                    fontWeight="600"
                    _selected={{
                      color: "#004CFC",
                      fontWeight: "800",
                    }}>
                    {t("Timeline")}
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="session" pt={6}>
                  {memoizedProposalInteractionCard}
                </Tabs.Content>
                <Tabs.Content value="timeline" pt={6}>
                  {memoizedProposalTimeline}
                </Tabs.Content>
              </Tabs.Root>
            ) : (
              <>
                {memoizedProposalInteractionCard}
                {memoizedProposalTimeline}
              </>
            )}
          </VStack>
        </GridItem>
        <GridItem colSpan={[3, 3, 2]} order={[2, 2, 3]}>
          <ProposalVoteCommentList proposalId={proposalId} />
        </GridItem>
      </Grid>
    </VStack>
  )
}
