import { useProposalInteractionDates } from "@/api"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { ProposalTimeline } from "./ProposalTimeline"
import { useTranslation } from "react-i18next"
import { useBreakpoints, useProposalEnrichedById } from "@/hooks"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { Grid, GridItem, Skeleton, Tabs, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useMemo } from "react"
import { ProposalInteractionCard } from "./ProposalInteractionCard"
import { ProposalOverview } from "./ProposalOverview"
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
      label: isGrant ? "Grants" : "Proposals", //TODO: This should be dynamic based on the proposal type like "Grants" or "Proposals"
      href: isGrant ? "/proposals/grants" : "/proposals",
    },
    {
      label: "Overview",
      href: `/proposals/${proposalId}`,
    },
  ]

  //TODO: Cleanup this shared info
  const isVotingPhase = proposal?.state === ProposalState.Active
  const targetDate = isVotingPhase ? votingEndDate : supportEndDate

  const { daysLeft, hoursLeft, minutesLeft } = useMemo(() => {
    const now = dayjs()
    const daysLeft = dayjs(targetDate).diff(now, "days")
    const hoursLeft = dayjs(targetDate).diff(now, "hours") % 24
    const minutesLeft = dayjs(targetDate).diff(now, "minutes") % 60
    return {
      daysLeft,
      hoursLeft,
      minutesLeft,
    }
  }, [targetDate])

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <PageBreadcrumb items={BreadcrumItems} />

      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} order={[2, 2, 1]}>
          {/*TODO: CHECK IF WE NEED LOADING STATE */}
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
                  <ProposalInteractionCard
                    proposal={proposal}
                    isVotingPhase={isVotingPhase}
                    daysLeft={daysLeft}
                    hoursLeft={hoursLeft}
                    minutesLeft={minutesLeft}
                    isLoading={isLoading}
                  />
                </Tabs.Content>
                <Tabs.Content value="timeline" pt={6}>
                  <ProposalTimeline proposal={proposal} />
                </Tabs.Content>
              </Tabs.Root>
            ) : (
              <>
                <ProposalInteractionCard
                  proposal={proposal}
                  daysLeft={daysLeft}
                  hoursLeft={hoursLeft}
                  minutesLeft={minutesLeft}
                  isVotingPhase={isVotingPhase}
                  isLoading={isLoading}
                />
                <ProposalTimeline proposal={proposal} />
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
