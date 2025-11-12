import { Badge, Button, Card, Flex, Grid, Heading, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { NavArrowLeft, NavArrowRight } from "iconoir-react"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { RoundEarnings } from "@/app/allocations/history/page"

import { AllocationRoundDetails } from "../../../page"
import { RoundActiveAppsListCard } from "../../RoundActiveAppsListCard"
import { UserVotingActivityCard } from "../../UserVotingActivityCard"

import { RoundDistributionCard } from "./RoundDistributionCard"
import { RoundHistoryCard } from "./RoundHistoryCard"

export function RoundInfoTab({
  roundDetails,
  previous3RoundsEarnings,
}: {
  roundDetails: AllocationRoundDetails
  previous3RoundsEarnings: RoundEarnings[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cycleTotal, totalVoters, apps, xAllocationsAmount, treasuryAmount, vote2EarnAmount } = roundDetails

  const handleRoundNavigation = (newRoundId: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", "round")
    params.set("roundId", newRoundId.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <VStack alignItems="stretch" gap="5" w="full" mt="2">
      <VStack hideFrom="md" alignItems="stretch" gap="2">
        <HStack gap="2">
          <Text textStyle="md" fontWeight="semibold">
            {"Round"} {roundDetails.id}
          </Text>
          {roundDetails.currentRoundId === roundDetails.id && <Badge variant="positive">{"Active"}</Badge>}
        </HStack>
        <Text textStyle="sm" color="text.subtle">
          {"Aug 11 - Aug 18"}
        </Text>
      </VStack>
      <Card.Root hideBelow="md" p="6" alignItems="center" justifyContent="space-between" flexDirection="row">
        <Grid gridTemplateColumns="repeat(3,max-content)" divideX="1px" divideColor="border.secondary" columnGap="6">
          <VStack gap="1" align="start">
            <Text textStyle="md" color="text.subtle">
              {"Round"}
            </Text>
            <Heading size="4xl">{roundDetails.id}</Heading>
          </VStack>
          <VStack gap="1" pl="6" align="start">
            <Text textStyle="md" color="text.subtle">
              {"Round dates"}
            </Text>
            <Heading size="lg">{"Aug 3 - Aug 10"}</Heading>
          </VStack>
          {roundDetails.currentRoundId === roundDetails.id && (
            <Flex h="full" pl="6" alignItems="flex-start">
              <Badge variant="positive">{"Active"}</Badge>
            </Flex>
          )}
        </Grid>
        <Flex columnGap="4">
          <IconButton
            variant="outline"
            boxSize={"44px"}
            onClick={() => handleRoundNavigation(roundDetails.id - 1)}
            disabled={roundDetails.id <= 1}
            aria-label="Previous round">
            <NavArrowLeft />
          </IconButton>
          <IconButton
            variant="outline"
            boxSize={"44px"}
            onClick={() => handleRoundNavigation(roundDetails.id + 1)}
            aria-label="Next round">
            <NavArrowRight />
          </IconButton>
          <Button variant="link" p="0" size="md">
            {"View all rounds"}
          </Button>
        </Flex>
      </Card.Root>

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

      <VStack hideFrom="md" gap="3" alignItems="stretch">
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
      <Grid hideBelow="md" gridTemplateColumns="repeat(2,1fr)" gap="6">
        <UserVotingActivityCard roundId={BigInt(roundDetails.id)} apps={apps} />
        <RoundActiveAppsListCard apps={apps} />
      </Grid>
    </VStack>
  )
}
