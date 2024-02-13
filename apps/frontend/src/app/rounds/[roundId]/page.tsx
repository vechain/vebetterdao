"use client"

import { Box, Stack, VStack } from "@chakra-ui/react"
import { AllocationRoundDetails } from "../components/AllocationRoundDetails"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { AllocationXAppsVotesCard } from "@/components"
import { AllocationRoundSessionInfoCard } from "../components/AllocationRoundSessionInfoCard"
import { AllocationRoundTimeline } from "../components/AllocationRoundTimeline"

export default function Round({ params }: { params: { roundId: string } }) {
  return (
    <VStack w="full" spacing={8}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundDetails roundId={params.roundId} />
      <Stack direction={["column-reverse", "column-reverse", "row"]} w="full" justify="space-between" spacing={8}>
        <Box flex={0.74}>
          <AllocationXAppsVotesCard roundId={params.roundId} />
        </Box>
        <VStack flex={0.25} spacing={8}>
          <AllocationRoundSessionInfoCard roundId={params.roundId} />
          <AllocationRoundTimeline roundId={params.roundId} />
        </VStack>
      </Stack>
    </VStack>
  )
}
