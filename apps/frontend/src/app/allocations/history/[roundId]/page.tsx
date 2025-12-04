import { Heading, VStack, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

import { RoundActiveAppsListCard } from "../../components/RoundActiveAppsListCard"
import { RoundDistributionCard } from "../../components/tabs/round-info/RoundDistributionCard"
import { UserVotingActivityCard } from "../../components/UserVotingActivityCard"
import { AllocationRoundDetails, getHistoricalRoundData } from "../../lib/data"
import { HistoryDetailSkeleton } from "../components/HistoryDetailSkeleton"

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
    <VStack alignItems="stretch" w="full" gap="4">
      <PageBreadcrumb
        items={[
          { label: "Allocations", href: "/allocations" },
          { label: "History", href: "/allocations/history" },
          { label: "Round details", href: `/allocations/history/${roundIdParam}` },
        ]}
      />

      <VStack alignItems="stretch" w="full" gap="4">
        <VStack alignItems="stretch" w="full" gap="2">
          <Heading size="md">{`Round ${roundIdParam}`}</Heading>
          <Text textStyle="sm">
            {dayjs(roundDetails.roundStart).format("MMM D") + " - " + dayjs(roundDetails.roundEnd).format("MMM D")}
          </Text>
        </VStack>
        <RoundDistributionCard roundDetails={roundDetails} />
        <UserVotingActivityCard roundDetails={roundDetails} />
        <RoundActiveAppsListCard roundId={roundDetails.id} apps={roundDetails.apps} />
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
