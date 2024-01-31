"use client"

import { useProposalsEvents } from "@/api"
import { CreateProposalButton } from "@/components"
import { Box, HStack, Heading, Icon, Text, VStack } from "@chakra-ui/react"
import { FaScroll } from "react-icons/fa"

export default function ProposalsPage() {
  const { data } = useProposalsEvents()
  console.log({ data })

  return (
    <VStack w="full" spacing={8}>
      <HStack spacing={4} w="full" justify={"space-between"} alignItems={"center"}>
        <Box>
          <HStack spacing={3} alignItems={"center"}>
            <Icon as={FaScroll} fontSize={"3xl"} />
            <Heading as="h1" size="xl">
              Proposals
            </Heading>
          </HStack>
          <Text fontSize="lg">Total: {data?.created.length}</Text>
        </Box>
        <CreateProposalButton />
      </HStack>
    </VStack>
  )
}
