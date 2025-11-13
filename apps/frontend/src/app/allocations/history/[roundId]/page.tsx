import { Heading, VStack, Text } from "@chakra-ui/react"
import { redirect } from "next/navigation"

import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

import { RoundActiveAppsListCard } from "../../components/RoundActiveAppsListCard"
import { RoundDistributionCard } from "../../components/tabs/round-info/RoundDistributionCard"
import { UserVotingActivityCard } from "../../components/UserVotingActivityCard"
import { AllocationRoundDetails, getHistoricalRoundData } from "../../page"

export type Props = {
  params: {
    roundId: string
  }
}

export default async function Page({ params }: Readonly<Props>) {
  let roundDetails: AllocationRoundDetails

  const roundIdParam = params.roundId
  if (roundIdParam) {
    const roundId = parseInt(roundIdParam, 10)
    if (isNaN(roundId)) {
      return redirect("/allocations?tab=round")
    } else roundDetails = await getHistoricalRoundData(roundId)
  } else return redirect("/allocations?tab=round")

  const { apps, xAllocationsAmount, treasuryAmount, vote2EarnAmount, cycleTotal } = roundDetails
  const totalVoters = apps.reduce((sum, app) => sum + (app.voters ?? 0), 0)

  return (
    <VStack alignItems="stretch" w="full" gap="4">
      <PageBreadcrumb
        items={[
          {
            label: "Allocations",
            href: "/allocations",
          },
          {
            label: "History",
            href: "/allocations/history",
          },

          {
            label: "Round details",
            href: `/allocations/history/${params.roundId}`,
          },
        ]}
      />

      <VStack alignItems="stretch" w="full" gap="4">
        <VStack alignItems="stretch" w="full" gap="2">
          <Heading size="md">{`Round ${params.roundId}`}</Heading>
          <Text textStyle="sm">{"Aug 3 - Aug 10"}</Text>
        </VStack>
        <RoundDistributionCard
          roundDetails={{
            totalVP: cycleTotal,
            totalVoters,
            totalApp: apps.length,
            xAllocationsAmount,
            treasuryAmount,
            vote2EarnAmount,
          }}
        />
        <UserVotingActivityCard roundDetails={roundDetails} />
        <RoundActiveAppsListCard apps={apps} />
      </VStack>
    </VStack>
  )
}
