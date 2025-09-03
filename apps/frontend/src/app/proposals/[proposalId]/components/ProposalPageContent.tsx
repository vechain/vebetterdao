import { Grid, GridItem, VStack, Text, Tabs } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { useMemo } from "react"
import { ProposalType } from "@/hooks/proposals/grants/types"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useProposalEnriched, useBreakpoints } from "@/hooks"
// import { ProposalTimeline } from "./ProposalTimeline"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: { proposals } = { proposals: [] }, isLoading } = useProposalEnriched()
  const { isMobile } = useBreakpoints()

  const proposal = useMemo(() => {
    return proposals.find(p => p.id === proposalId)
  }, [proposals, proposalId])

  const isGrant = useMemo(() => {
    return proposal?.type === ProposalType.Grant
  }, [proposal])

  //TODO: Ensure we have a proposal
  if (!proposal) return null

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

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <PageBreadcrumb items={BreadcrumItems} />

      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} order={[2, 2, 1]}>
          <ProposalOverview isGrant={isGrant} proposal={proposal} isLoading={isLoading} />
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
                  <Text>{"Session"}</Text>
                </Tabs.Content>
                <Tabs.Content value="timeline" pt={6}>
                  <Text>{"Timeline"}</Text>
                  {/* <ProposalTimeline proposal={proposal} /> */}
                </Tabs.Content>
              </Tabs.Root>
            ) : (
              <>
                <Text>{"Session"}</Text>

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
