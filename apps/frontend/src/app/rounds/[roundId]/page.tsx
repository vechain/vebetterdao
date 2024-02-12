"use client"

import { VStack } from "@chakra-ui/react"
import { AllocationRoundDetails } from "../components/AllocationRoundDetails"

export default function Round({ params }: { params: { roundId: string } }) {
  return (
    <VStack w="full" spacing={12}>
      <AllocationRoundDetails roundId={params.roundId} />
    </VStack>
  )
}
