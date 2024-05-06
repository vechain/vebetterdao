"use client"
import { VStack } from "@chakra-ui/react"
import { useParams } from "next/navigation"
import { ProposalOverview } from "./components/ProposalOverview"

export const Proposal = () => {
  const { proposalId } = useParams<{ proposalId: string }>()

  return (
    <VStack w="full" alignItems="stretch">
      <ProposalOverview />
    </VStack>
  )
}
