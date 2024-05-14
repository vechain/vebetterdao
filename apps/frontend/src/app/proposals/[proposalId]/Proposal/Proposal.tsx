"use client"
import { VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./components/ProposalOverview"

export const Proposal = () => {
  return (
    <VStack w="full" alignItems="stretch">
      <ProposalOverview />
    </VStack>
  )
}
