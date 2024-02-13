"use client"

import { Box, Stack, VStack } from "@chakra-ui/react"
import { AllocationRoundDetails } from "../components/AllocationRoundDetails"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { AllocationXAppsVotesCard } from "@/components"
import { AllocationRoundSessionInfoCard } from "../components/AllocationRoundSessionInfoCard"

export default function Round({ params }: { params: { roundId: string } }) {
  return (
    <VStack w="full" spacing={8}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundDetails roundId={params.roundId} />
      <Stack direction={["column-reverse", "column-reverse", "row"]} w="full" justify="space-between" spacing={8}>
        <Box flex={0.7}>
          <AllocationXAppsVotesCard roundId={params.roundId} />
        </Box>
        <Box flex={0.3}>
          <AllocationRoundSessionInfoCard roundId={params.roundId} />
        </Box>
      </Stack>
    </VStack>
  )
}
