import { Heading, VStack, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { RoundActiveAppsListCard } from "../../components/RoundActiveAppsListCard"
import { RoundDistributionCard } from "../../components/tabs/round-info/RoundDistributionCard"
import { UserVotingActivityCard } from "../../components/UserVotingActivityCard"
import { AllocationRoundDetails, getHistoricalRoundData } from "../../lib/data"
import { HistoryDetailSkeleton } from "../components/HistoryDetailSkeleton"
import { HistoryPageBreadcrumb } from "../components/HistoryPageBreadcrumb"

export type Props = {
  params: Promise<{
    roundId: string
  }>
}

async function HistoryDetailContent({ roundIdParam }: { roundIdParam: string }) {
  const roundId = parseInt(roundIdParam, 10)
  if (isNaN(roundId)) {
    return redirect("/allocations/round")
  }

  const roundDetails: AllocationRoundDetails = await getHistoricalRoundData(roundId)

  return (
    <VStack alignItems="stretch" w="full" gap={{ base: "3", md: "4" }}>
      <HistoryPageBreadcrumb roundId={roundId} />
      <VStack alignItems="stretch" w="full" gap="4">
        <VStack alignItems="stretch" w="full" gap="2">
          <Heading size="md">{`Round ${roundIdParam}`}</Heading>
          <Text textStyle="sm" color="text.subtle">
            {dayjs(roundDetails.roundStart).format("MMM D") + " - " + dayjs(roundDetails.roundEnd).format("MMM D")}
          </Text>
        </VStack>
        <RoundDistributionCard roundDetails={roundDetails} />
        <UserVotingActivityCard roundDetails={roundDetails} />
        <RoundActiveAppsListCard
          currentRoundId={roundDetails.currentRoundId}
          roundId={roundDetails.id}
          apps={roundDetails.apps}
        />
      </VStack>
    </VStack>
  )
}

export default async function Page({ params }: Readonly<Props>) {
  const { roundId: roundIdParam } = await params
  if (!roundIdParam) return redirect("/allocations/round")

  return (
    <Suspense key={roundIdParam} fallback={<HistoryDetailSkeleton roundId={roundIdParam} />}>
      <HistoryDetailContent roundIdParam={roundIdParam} />
    </Suspense>
  )
}
