import { Badge, Heading, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { NavArrowRight } from "iconoir-react"
import NextLink from "next/link"

import { RoundEarnings } from "@/app/allocations/history/page"

import { AllocationCurrentRoundDetails } from "../../../page"

import { RoundDistributionCard } from "./RoundDistributionCard"
import { RoundHistoryCard } from "./RoundHistoryCard"

export function RoundInfoTab({
  currentRoundDetails,
  previous3RoundsEarnings,
}: {
  currentRoundDetails: AllocationCurrentRoundDetails
  previous3RoundsEarnings: RoundEarnings[]
}) {
  const { cycleTotal, totalVoters, apps, xAllocationsAmount, treasuryAmount, vote2EarnAmount } = currentRoundDetails
  return (
    <VStack alignItems="stretch" gap="5" w="full" mt="2">
      <VStack alignItems="stretch" gap="2">
        <HStack gap="2">
          <Text textStyle="md" fontWeight="semibold">
            {"Round"} {currentRoundDetails.id}
          </Text>
          <Badge variant="positive">{"Active"}</Badge>
        </HStack>
        <Text textStyle="sm" color="text.subtle">
          {"Aug 11 - Aug 18"}
        </Text>
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

      <VStack gap="3" alignItems="stretch">
        <HStack justifyContent="space-between" w="full">
          <Heading size="lg" fontWeight="semibold">
            {"Explore rounds history"}
          </Heading>

          <IconButton variant="link" p="0" minWidth="unset" boxSize="4" color="text.subtle" asChild>
            <NextLink href="/allocations/history">
              <NavArrowRight />
            </NextLink>
          </IconButton>
        </HStack>

        {previous3RoundsEarnings.map(round => (
          <RoundHistoryCard key={round.roundId} round={round} />
        ))}
      </VStack>
    </VStack>
  )
}
