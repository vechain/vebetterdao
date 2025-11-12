import { Badge, Button, Card, Flex, Grid, Heading, HStack, Icon, IconButton, Text, VStack } from "@chakra-ui/react"
import { Activity, NavArrowLeft, NavArrowRight, SmartphoneDevice } from "iconoir-react"
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
      <VStack hideFrom="md" alignItems="stretch" gap="2">
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
      <Card.Root hideBelow="md" p="6" alignItems="center" justifyContent="space-between" flexDirection="row">
        <Grid gridTemplateColumns="repeat(3,max-content)" divideX="1px" divideColor="border.secondary" columnGap="6">
          <VStack gap="1" align="start">
            <Text textStyle="md" color="text.subtle">
              {"Round"}
            </Text>
            <Heading size="4xl">{currentRoundDetails.id}</Heading>
          </VStack>
          <VStack gap="1" pl="6" align="start">
            <Text textStyle="md" color="text.subtle">
              {"Round dates"}
            </Text>
            <Heading size="lg">{"Aug 3 - Aug 10"}</Heading>
          </VStack>
          <Flex h="full" pl="6" alignItems="flex-start">
            <Badge variant="positive">{"Active"}</Badge>
          </Flex>
        </Grid>
        <Flex columnGap="4">
          <IconButton variant="outline" boxSize={"44px"}>
            <NavArrowLeft />
          </IconButton>
          <IconButton variant="outline" boxSize={"44px"}>
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
      <Grid gridTemplateColumns="repeat(2,1fr)" gap="6">
        <Card.Root p="6">
          <Card.Header as={HStack} gap="2">
            <Icon as={Activity} boxSize="5" color="icon.default" />
            <Heading size="lg" fontWeight="semibold">
              {"Your voting activity"}
            </Heading>
          </Card.Header>
        </Card.Root>
        <Card.Root p="6">
          <Card.Header as={HStack} justifyContent="space-between">
            <Heading as={HStack} size="lg" fontWeight="semibold">
              <Icon as={SmartphoneDevice} boxSize="5" color="icon.default" />
              {"Active apps"}
            </Heading>
            <Badge variant="neutral" size="sm" rounded="sm">
              {"12 apps"}
            </Badge>
          </Card.Header>
        </Card.Root>
      </Grid>
    </VStack>
  )
}
