export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Tabs } from "@chakra-ui/react"
import { redirect } from "next/navigation"

import { FeatureFlag, featureFlags } from "@/constants/featureFlag"
import { getPageMetadata } from "@/utils/metadata"

import { AllocationTabsProvider } from "../components/tabs/AllocationTabsProvider"
import { RoundInfoTab } from "../components/tabs/round-info/RoundInfoTab"
import { TabNavigation } from "../components/tabs/TabNavigation"
import { VoteTab } from "../components/tabs/vote/VoteTab"
import { getHistoricalRoundData } from "../lib/data"

export const metadata = getPageMetadata("allocations")

interface TabsPageProps {
  params: Promise<{ tab: string }>
  searchParams: Promise<{ roundId?: string }>
}

export default async function TabsPage({ params, searchParams }: TabsPageProps) {
  if (!featureFlags[FeatureFlag.ALLOCATION_REDESIGN].enabled) return redirect("/rounds")

  const { tab = "vote" } = await params
  const { roundId: roundIdParam } = await searchParams

  if (tab !== "" && tab !== "vote" && tab !== "round") return redirect("/allocations")

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
      <TabNavigation currentTab={tab}>
        <Tabs.Content value="vote" display="flex" flexDirection="column" gap="4">
          <VoteTab />
        </Tabs.Content>
        <Tabs.Content value="round">
          <RoundInfoTab />
        </Tabs.Content>
      </TabNavigation>
    </AllocationTabsProvider>
  )
}
