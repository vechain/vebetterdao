export const dynamic = "force-dynamic"

import { Grid, GridItem, Heading, Tabs, VStack } from "@chakra-ui/react"
import { redirect } from "next/navigation"

import { FeatureFlag, featureFlags } from "@/constants/featureFlag"
import { getPageMetadata } from "@/utils/metadata"

import { CountdownBox } from "../components/CountdownBox"
import { PotentialRewardBox } from "../components/PotentialRewardBox"
import { AllocationTabsProvider } from "../components/tabs/AllocationTabsProvider"
import { TabNavigation } from "../components/tabs/TabNavigation"
import { VotingPowerBox } from "../components/VotingPowerBox"
import { getHistoricalRoundData } from "../lib/data"

export const metadata = getPageMetadata("allocations")

interface TabsLayoutProps {
  children: React.ReactNode
  vote: React.ReactNode
  round: React.ReactNode
  searchParams: Promise<{ tab?: string; roundId?: string }>
}

export default async function TabsLayout({ vote, round, searchParams }: TabsLayoutProps) {
  if (!featureFlags[FeatureFlag.ALLOCATION_REDESIGN].enabled) return redirect("/rounds")

  const params = await searchParams
  const roundIdParam = params?.roundId

  let roundDetails

  if (roundIdParam) {
    const roundId = parseInt(roundIdParam, 10)
    if (!isNaN(roundId)) {
      roundDetails = await getHistoricalRoundData(roundId)
    } else {
      roundDetails = await getHistoricalRoundData()
    }
  } else {
    roundDetails = await getHistoricalRoundData()
  }

  return (
    <AllocationTabsProvider roundDetails={roundDetails}>
      <VStack alignItems="stretch" gap="2" w="full" mb="6">
        <Heading size={{ base: "xl", md: "3xl" }}>{"Allocation"}</Heading>
        <Grid
          templateRows={{ base: "repeat(2,1fr)", md: "1fr" }}
          templateColumns={{ base: "repeat(2,1fr)", md: "repeat(3,1fr)" }}
          gap="2">
          <GridItem colSpan={{ base: 2, md: 1 }} w="full">
            <VotingPowerBox />
          </GridItem>
          <GridItem asChild>
            <PotentialRewardBox roundDetails={roundDetails} />
          </GridItem>
          <GridItem asChild>
            <CountdownBox deadline={roundDetails?.currentRoundDeadline} />
          </GridItem>
        </Grid>
      </VStack>

      <TabNavigation>
        <Tabs.Content value="vote" display="flex" flexDirection="column" gap="4">
          {vote}
        </Tabs.Content>
        <Tabs.Content value="round">{round}</Tabs.Content>
      </TabNavigation>
    </AllocationTabsProvider>
  )
}
