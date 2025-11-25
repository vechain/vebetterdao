"use client"

import { Box, Card, Icon, Separator, Text, VStack, HStack, SimpleGrid, Button, GridItem } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { Gift, NavArrowRight, SmartphoneDevice, Group, Flash, List } from "iconoir-react"
import { useMemo, useState } from "react"
import { formatEther } from "viem"

import B3TRIcon from "@/components/Icons/svg/b3tr.svg"

import { AllocationRoundDetails } from "../../../lib/data"

import { TotalRewardDistributionProgress } from "./TotalRewardDistributionProgress"
import { TotalRewardsDistributionModal } from "./TotalRewardsDistributionModal"

export function RoundDistributionCard({ roundDetails }: { roundDetails: AllocationRoundDetails }) {
  const [open, setOpen] = useState(false)
  const distribution = useMemo(() => {
    const toApps = Number(roundDetails.xAllocationsAmount)
    const toVoters = Number(roundDetails.vote2EarnAmount)
    const toTreasury = Number(roundDetails.treasuryAmount)
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
  }, [roundDetails.xAllocationsAmount, roundDetails.vote2EarnAmount, roundDetails.treasuryAmount])

  return (
    <>
      <Button unstyled asChild onClick={() => setOpen(true)}>
        <Card.Root
          p="4"
          variant="outline"
          border="sm"
          borderColor="border.secondary"
          flexDirection={{ base: "column", md: "row" }}
          justifyContent={{ base: "unset", md: "space-between" }}
          gap={{ base: "unset", md: "12" }}>
          <SimpleGrid flex={1} columns={3} rowGap="2" columnGap={{ base: "unset", md: "3" }}>
            <GridItem
              hideBelow="md"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gridColumn="1 / span 3">
              <HStack gap="2">
                <Icon as={List} boxSize={{ base: "4", md: "5" }} color="text.subtle" />
                <Text
                  textStyle={{ base: "sm", md: "lg" }}
                  fontWeight={{ base: "normal", md: "semibold" }}
                  color="text.subtle">
                  {"Summary"}
                </Text>
              </HStack>
            </GridItem>
            {(
              [
                ["Total apps", SmartphoneDevice, (roundDetails?.apps || []).length],
                ["Total voters", Group, getCompactFormatter(2).format(roundDetails.totalVoters)],
                ["Total VP", Flash, getCompactFormatter(2).format(Number(formatEther(roundDetails.totalVP)))],
              ] as const
            ).map(([label, icon, value]) => (
              <GridItem key={label}>
                <Card.Root
                  p={{ base: "0", md: "4" }}
                  bg={{ base: "transparent", md: "card.subtle" }}
                  gap="1"
                  mx={{ base: "auto", md: "unset" }}>
                  <HStack gap="2">
                    <Icon as={icon} boxSize={{ base: "4", md: "5" }} color="icon.subtle" />
                    <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
                      {label}
                    </Text>
                  </HStack>

                  <Text textStyle="md" fontWeight="semibold">
                    {value}
                  </Text>
                </Card.Root>
              </GridItem>
            ))}
          </SimpleGrid>

          <Separator hideFrom="md" my="5" borderColor="border.secondary" />

          <VStack flex={1} alignItems="stretch" gap="3">
            <HStack justifyContent="space-between" w="full">
              <HStack gap="2">
                <Icon as={Gift} boxSize={{ base: "4", md: "5" }} color="text.subtle" />
                <Text
                  textStyle={{ base: "sm", md: "lg" }}
                  fontWeight={{ base: "normal", md: "semibold" }}
                  color="text.subtle">
                  {"Total rewards distributed"}
                </Text>
              </HStack>
              <Icon hideFrom="md" as={NavArrowRight} boxSize="4" color="text.subtle" />
              <Button hideBelow="md" variant="link" p="0">
                {"Details"}
              </Button>
            </HStack>

            <HStack gap="2">
              <Icon boxSize={{ base: "5", md: "6" }}>
                <B3TRIcon />
              </Icon>
              <Text textStyle={{ base: "md", md: "xl" }} fontWeight={{ base: "semibold", md: "bold" }}>
                {getCompactFormatter(2).format(Number(formatEther(BigInt(distribution.total)))) + " B3TR"}
              </Text>
            </HStack>

            <VStack alignItems="stretch" gap="1">
              <TotalRewardDistributionProgress
                size={{ base: "xs", md: "sm" }}
                apps={distribution.appsPercent}
                voters={distribution.votersPercent}
              />
              <HStack gap="8" pt="1">
                <HStack gap="1" flex={1} borderRight="1px" borderColor="border.secondary" pr="5">
                  <Box boxSize="1.5" bg="status.positive.primary" rounded="full" />
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.default">
                    {"To apps"}
                  </Text>
                </HStack>
                <HStack gap="1" flex={1} borderRight="1px" borderColor="border.secondary" pr="5">
                  <Box boxSize="1.5" bg="status.info.strong" rounded="full" />
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.default">
                    {"To voters"}
                  </Text>
                </HStack>
                <HStack gap="1">
                  <Box boxSize="1.5" bg="status.warning.primary" rounded="full" />
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.default">
                    {"To treasury"}
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </VStack>
        </Card.Root>
      </Button>
      <TotalRewardsDistributionModal roundDetails={roundDetails} isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
