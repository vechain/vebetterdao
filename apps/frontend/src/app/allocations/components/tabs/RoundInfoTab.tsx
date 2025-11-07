"use client"

import {
  Badge,
  Box,
  Card,
  HStack,
  Icon,
  LinkBox,
  LinkOverlay,
  Separator,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Gift, Group, NavArrowRight, SmartphoneDevice, Flash } from "iconoir-react"
import NextLink from "next/link"

import { B3TRIcon } from "@/components/Icons/B3TRIcon"

import { AllocationCurrentRoundDetails } from "../../page"

const formatLargeNumber = (num: number) => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

export function RoundInfoTab({ currentRoundDetails }: { currentRoundDetails: AllocationCurrentRoundDetails }) {
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

      <LinkBox>
        <LinkOverlay asChild>
          <Card.Root p="4" variant="outline" borderColor="border.secondary">
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
                {formatLargeNumber(currentRoundDetails.totalVoters)}
              </Text>
              <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                {formatLargeNumber(Number(currentRoundDetails.totalVP))}
              </Text>
            </SimpleGrid>

            <Separator my="5" borderColor="border.secondary" />

            <NextLink href="/allocations/history">
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
                    {"3.5M B3TR"}
                  </Text>
                </HStack>

                <VStack alignItems="stretch" gap="1">
                  <Box h="1" bg="bg.subtle" rounded="full" overflow="hidden" display="flex">
                    <Box flex="1" bg="status.positive.primary" />
                    <Box w="27px" bg="status.info.strong" />
                    <Box w="35px" bg="status.warning.primary" />
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
            </NextLink>
          </Card.Root>
        </LinkOverlay>
      </LinkBox>
    </VStack>
  )
}
