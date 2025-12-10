export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Tabs } from "@chakra-ui/react"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { getPageMetadata } from "@/utils/metadata"

import { AllocationTabsProvider } from "../components/tabs/AllocationTabsProvider"
import { RoundInfoTab } from "../components/tabs/round-info/RoundInfoTab"
import { RoundInfoTabSkeleton } from "../components/tabs/RoundInfoTabSkeleton"
import { TabNavigation } from "../components/tabs/TabNavigation"
import { VoteTab } from "../components/tabs/vote/VoteTab"
import { VoteTabSkeleton } from "../components/tabs/VoteTabSkeleton"
import { getHistoricalRoundData } from "../lib/data"

export const metadata = getPageMetadata("allocations")

interface TabsPageProps {
  params: Promise<{ tab: string }>
  searchParams: Promise<{ roundId?: string }>
}

async function AllocationContent({ roundIdParam }: { roundIdParam?: string }) {
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
      <Tabs.Content value="vote" display="flex" flexDirection="column" gap="4">
        <VoteTab />
      </Tabs.Content>
      <Tabs.Content value="round">
        <RoundInfoTab />
      </Tabs.Content>
    </AllocationTabsProvider>
  )
}

export default async function TabsPage({ params, searchParams }: TabsPageProps) {
  const { tab = "vote" } = await params
  const { roundId: roundIdParam } = await searchParams

  if (tab !== "" && tab !== "vote" && tab !== "round") return redirect("/allocations")

  const fallback =
    tab === "round" ? (
      <Tabs.Content value="round">
        <RoundInfoTabSkeleton />
      </Tabs.Content>
    ) : (
      <Tabs.Content value="vote" display="flex" flexDirection="column" gap="4">
        <VoteTabSkeleton />
      </Tabs.Content>
    )

  return (
    <TabNavigation currentTab={tab}>
      <Suspense key={roundIdParam ?? "current"} fallback={fallback}>
        <AllocationContent roundIdParam={roundIdParam} />
      </Suspense>
    </TabNavigation>
  )
}
