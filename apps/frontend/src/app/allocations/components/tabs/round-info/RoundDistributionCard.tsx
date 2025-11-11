import { Box, Card, Icon, Separator, Text, VStack, HStack, SimpleGrid } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { Gift, NavArrowRight, SmartphoneDevice, Group, Flash } from "iconoir-react"
import { useMemo } from "react"
import { formatEther } from "viem"

import B3TRIcon from "@/components/Icons/svg/b3tr.svg"

import { AllocationCurrentRoundDetails } from "../../../page"

export function RoundDistributionCard({
  roundDetails,
}: {
  roundDetails: Pick<
    AllocationCurrentRoundDetails,
    "xAllocationsAmount" | "vote2EarnAmount" | "treasuryAmount" | "totalVoters" | "totalVP"
  > & {
    totalApp: number
  }
}) {
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
          {roundDetails.totalApp}
        </Text>
        <Text textStyle="md" fontWeight="semibold">
          {getCompactFormatter(3).format(roundDetails.totalVoters)}
        </Text>
        <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
          {getCompactFormatter(2).format(Number(formatEther(roundDetails.totalVP)))}
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
  )
}
