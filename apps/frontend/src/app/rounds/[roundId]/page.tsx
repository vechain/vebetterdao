"use client"

import { VStack } from "@chakra-ui/react"
import { AllocationRoundDetails } from "../components/AllocationRoundDetails"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"

export default function Round({ params }: { params: { roundId: string } }) {
  return (
    <VStack w="full" spacing={6}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundDetails roundId={params.roundId} />
    </VStack>
  )
}
