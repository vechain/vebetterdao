"use client"

import { useProposalCreatedEvents } from "@/api"
import { Box, Heading, Text } from "@chakra-ui/react"

export default function ProposalsPage() {
  const { data } = useProposalCreatedEvents()
  console.log({ data })
  return (
    <Box>
      <Heading as="h1" size="2xl">
        Proposals
      </Heading>
    </Box>
  )
}
