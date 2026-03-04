export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Stack, Tabs, VStack } from "@chakra-ui/react"
import { redirect } from "next/navigation"
import { cache, Suspense } from "react"

import { getPageMetadata } from "@/utils/metadata"

import { AllocationTabsProvider } from "../components/tabs/AllocationTabsProvider"
import { RoundDistributionCard } from "../components/tabs/round-info/RoundDistributionCard"
import { RoundInfoHeader } from "../components/tabs/round-info/RoundInfoHeader"
import { RoundInfoTab } from "../components/tabs/round-info/RoundInfoTab"
import { RoundInfoSectionSkeleton } from "../components/tabs/RoundInfoSectionSkeleton"
import { RoundInfoTabSkeleton } from "../components/tabs/RoundInfoTabSkeleton"
import { TabNavigation } from "../components/tabs/TabNavigation"
import { VoteTab } from "../components/tabs/vote/VoteTab"
import { VoteTabSkeleton } from "../components/tabs/VoteTabSkeleton"
import { getHistoricalRoundData } from "../lib/data"

export const metadata = getPageMetadata("allocations")

const getCachedRoundData = cache((roundId?: number) => getHistoricalRoundData(roundId))

function parseRoundId(roundIdParam?: string) {
  if (!roundIdParam) return undefined
  const parsed = parseInt(roundIdParam, 10)
  return isNaN(parsed) ? undefined : parsed
}

interface TabsPageProps {
  params: Promise<{ tab: string }>
  searchParams: Promise<{ roundId?: string }>
}

async function RoundInfoSection({ roundIdParam }: { roundIdParam?: string }) {
  const roundDetails = await getCachedRoundData(parseRoundId(roundIdParam))

  return (
    <VStack w="full" gap="4">
      <RoundInfoHeader roundDetails={roundDetails} />
      <RoundDistributionCard roundDetails={roundDetails} />
    </VStack>
  )
}

async function AllocationContent({ roundIdParam }: { roundIdParam?: string }) {
  const roundDetails = await getCachedRoundData(parseRoundId(roundIdParam))

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

  const roundDetails = await getCachedRoundData(parseRoundId(roundIdParam))
  const isCurrentRound = roundDetails.currentRoundId === roundDetails.id

  // Past rounds only show round info — redirect vote tab to round tab
  if (!isCurrentRound && tab === "vote") {
    const params = new URLSearchParams()
    if (roundIdParam) params.set("roundId", roundIdParam)
    return redirect(`/allocations/round?${params.toString()}`)
  }

  const tabFallback =
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
    <Stack w="full" gap="4">
      <Suspense key={roundIdParam ?? "current"} fallback={<RoundInfoSectionSkeleton />}>
        <RoundInfoSection roundIdParam={roundIdParam} />
      </Suspense>
      <TabNavigation currentTab={tab} isCurrentRound={isCurrentRound}>
        <Suspense key={roundIdParam ?? "current"} fallback={tabFallback}>
          <AllocationContent roundIdParam={roundIdParam} />
        </Suspense>
      </TabNavigation>
    </Stack>
  )
}
