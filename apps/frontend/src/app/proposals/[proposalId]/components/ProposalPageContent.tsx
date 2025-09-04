import { useProposalInteractionDates } from "@/api"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useBreakpoints, useProposalEnrichedById } from "@/hooks"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { Grid, GridItem, Tabs, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useMemo } from "react"

import { ProposalInteractionCard } from "./ProposalInteractionCard"
import { ProposalOverview } from "./ProposalOverview"

// import { ProposalTimeline } from "./ProposalTimeline"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const proposal = useProposalEnrichedById(proposalId)

  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposal!)
  const { isMobile } = useBreakpoints()

  const isGrant = useMemo(() => {
    return proposal?.type === ProposalType.Grant
  }, [proposal])

  const BreadcrumItems = [
    {
      label: "Proposals", //TODO: This should be dynamic based on the proposal type like "Grants" or "Proposals"
      href: "/proposals",
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
  //TODO: Ensure we have a proposal
  if (!proposal) return null
  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <PageBreadcrumb items={BreadcrumItems} />

      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} order={[2, 2, 1]}>
          {/*TODO: CHECK IF WE NEED LOADING STATE */}
          <ProposalOverview isGrant={isGrant} proposal={proposal} isLoading={false} />
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
                    {"Session"}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="timeline"
                    color="text.subtle"
                    fontWeight="600"
                    _selected={{
                      color: "#004CFC",
                      fontWeight: "800",
                    }}>
                    {"Timeline"}
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="session" pt={6}>
                  <ProposalInteractionCard
                    proposal={proposal}
                    isVotingPhase={isVotingPhase}
                    daysLeft={daysLeft}
                    hoursLeft={hoursLeft}
                    minutesLeft={minutesLeft}
                  />
                </Tabs.Content>
                <Tabs.Content value="timeline" pt={6}>
                  <Text>{"Timeline"}</Text>
                  {/* <ProposalTimeline proposal={proposal} /> */}
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
                />
                <Text>{"Timeline"}</Text>

                {/* <Session Information component/> */}
                {/* <ProposalTimeline proposal={proposal} /> */}
              </>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  )
}
