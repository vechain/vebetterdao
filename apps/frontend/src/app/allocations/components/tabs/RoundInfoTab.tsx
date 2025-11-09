"use client"

import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  LinkBox,
  LinkOverlay,
  Mark,
  Separator,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { Gift, Group, NavArrowRight, SmartphoneDevice, Flash } from "iconoir-react"
import NextLink from "next/link"
import { useMemo } from "react"
import { formatEther } from "viem"

import { B3TRIcon } from "@/components/Icons/B3TRIcon"

import { AllocationCurrentRoundDetails } from "../../page"

export function RoundInfoTab({ currentRoundDetails }: { currentRoundDetails: AllocationCurrentRoundDetails }) {
  const distribution = useMemo(() => {
    const toApps = Number(currentRoundDetails.xAllocationsAmount)
    const toVoters = Number(currentRoundDetails.vote2EarnAmount)
    const toTreasury = Number(currentRoundDetails.treasuryAmount)
    const total = toApps + toVoters + toTreasury

    const appsPercent = (toApps / total) * 100
    const votersPercent = (toVoters / total) * 100
    const treasuryPercent = (toTreasury / total) * 100

    return {
      total,
      appsPercent,
      votersPercent,
      treasuryPercent,
    }
  }, [currentRoundDetails.xAllocationsAmount, currentRoundDetails.vote2EarnAmount, currentRoundDetails.treasuryAmount])

  const previous3RoundIds = Array(3)
    .fill(currentRoundDetails.id)
    .map((id, idx) => id - idx - 1)

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

      <Card.Root p="4" variant="outline" border="sm" borderColor="border.secondary">
        <SimpleGrid columns={3} rowGap="2">
          <HStack gap="2">
            <Icon as={SmartphoneDevice} color="icon.subtle" boxSize="4" />
            <Text textStyle="sm" color="text.subtle">
              {"Total apps"}
            </Text>
          </HStack>
          <HStack gap="2">
            <Icon as={Group} boxSize="4" color="icon.subtle" />
            <Text textStyle="sm" color="text.subtle">
              {"Total voters"}
            </Text>
          </HStack>
          <HStack gap="2">
            <Icon as={Flash} boxSize="4" color="icon.subtle" />
            <Text textStyle="sm" color="text.subtle">
              {"Total VP"}
            </Text>
          </HStack>
          <Text textStyle="md" fontWeight="semibold">
            {currentRoundDetails.apps.length}
          </Text>
          <Text textStyle="md" fontWeight="semibold">
            {getCompactFormatter(3).format(currentRoundDetails.totalVoters)}
          </Text>
          <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
            {getCompactFormatter(2).format(Number(formatEther(currentRoundDetails.totalVP)))}
          </Text>
        </SimpleGrid>

        <Separator my="5" borderColor="border.secondary" />

        <VStack alignItems="stretch" gap="3">
          <HStack justifyContent="space-between" w="full">
            <HStack gap="2">
              <Icon as={Gift} boxSize="4" color="text.subtle" />
              <Text textStyle="sm" color="text.subtle">
                {"Total rewards distributed"}
              </Text>
            </HStack>
            <Icon as={NavArrowRight} boxSize="4" color="text.subtle" />
          </HStack>

          <HStack gap="2">
            <Icon boxSize="5">
              <B3TRIcon />
            </Icon>
            <Text textStyle="md" fontWeight="semibold">
              {getCompactFormatter(2).format(Number(formatEther(BigInt(distribution.total)))) + " B3TR"}
            </Text>
          </HStack>

          <VStack alignItems="stretch" gap="1">
            <Box h="1" bg="bg.subtle" rounded="full" overflow="hidden" display="flex">
              <Box w={`${distribution.appsPercent}%`} bg="status.positive.primary" />
              <Box w={`${distribution.votersPercent}%`} bg="status.info.strong" />
              <Box w={`${distribution.treasuryPercent}%`} bg="status.warning.primary" />
            </Box>

            <HStack gap="8" pt="1">
              <HStack gap="1" flex={1} borderRight="1px" borderColor="border.secondary" pr="5">
                <Box boxSize="1.5" bg="status.positive.primary" rounded="full" />
                <Text textStyle="xs" color="text.default">
                  {"To apps"}
                </Text>
              </HStack>
              <HStack gap="1" flex={1} borderRight="1px" borderColor="border.secondary" pr="5">
                <Box boxSize="1.5" bg="status.info.strong" rounded="full" />
                <Text textStyle="xs" color="text.default">
                  {"To voters"}
                </Text>
              </HStack>
              <HStack gap="1">
                <Box boxSize="1.5" bg="status.warning.primary" rounded="full" />
                <Text textStyle="xs" color="text.default">
                  {"To treasury"}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </VStack>
      </Card.Root>

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

        {previous3RoundIds.map(roundId => (
          <LinkBox key={roundId}>
            <LinkOverlay asChild>
              <Card.Root p="4" variant="outline" border="sm" borderColor="border.secondary">
                <NextLink href={`/allocations/history/${roundId}`}>
                  <HStack alignItems="center" justifyContent="space-between" gap="3">
                    <VStack gap="2" alignItems="flex-start">
                      <Heading size="md" fontWeight="semibold">
                        {roundId}
                      </Heading>
                      <Text textStyle="md">{"Jul 27 - Aug 2"}</Text>
                    </VStack>

                    <VStack gap="2" alignItems="flex-end">
                      <HStack gap="2">
                        <B3TRIcon boxSize="5" />
                        <Heading size="sm" fontWeight="semibold">
                          <Mark variant="text" color="status.positive.strong">
                            {"+0.4"}
                          </Mark>
                          {" / 3,8M"}
                        </Heading>
                      </HStack>
                      <Text textStyle="xs">{"Your rewards / total"}</Text>
                    </VStack>
                  </HStack>
                </NextLink>
              </Card.Root>
            </LinkOverlay>
          </LinkBox>
        ))}
      </VStack>
    </VStack>
  )
}
