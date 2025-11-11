import { Heading, VStack, Text } from "@chakra-ui/react"

import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

import { RoundDistributionCard } from "../../components/tabs/round-info/RoundDistributionCard"
import { getRoundDetails, getRoundResults } from "../../page"

export type Props = {
  params: {
    roundId: string
  }
}

export default async function Page({ params }: Readonly<Props>) {
  const { xAllocationsAmount, treasuryAmount, vote2EarnAmount, cycleTotal } = await getRoundDetails(
    BigInt(params.roundId),
  )
  const roundResults = await getRoundResults(Number(params.roundId))

  const apps = roundResults.data || []
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
      </VStack>
    </VStack>
  )
}
