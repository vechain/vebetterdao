"use client"

import { Box, HStack, Stack, VStack } from "@chakra-ui/react"
import { AllocationRoundDetails } from "../components/AllocationRoundDetails"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { AllocationXAppsVotesCard } from "@/components"

export default function Round({ params }: { params: { roundId: string } }) {
  return (
    <VStack w="full" spacing={8}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundDetails roundId={params.roundId} />
      <Stack direction={["column", "column", "row"]} w="full" justify="space-between" spacing={8}>
        <AllocationXAppsVotesCard roundId={params.roundId} />
        <AllocationXAppsVotesCard roundId={params.roundId} />
      </Stack>
    </VStack>
  )
}
