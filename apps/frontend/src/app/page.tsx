"use client"

import { useB3trTokenDetails } from "@/api"
import { Box, Heading, StackDivider, Text, VStack } from "@chakra-ui/react"
import { TokenDetailsCard } from "@/components"

export default function Home() {
  const tokenDetailsQueryResult = useB3trTokenDetails()

  return (
    <VStack spacing={4} divider={<StackDivider />}>
      <Box>
        <Heading as="h1" size="2xl">
          Welcome to the B3TR demo
        </Heading>
        <Text>Use the navigation bar on the left to navigate to the different pages.</Text>
      </Box>
      <TokenDetailsCard tokenDetailsQueryResult={tokenDetailsQueryResult} />
    </VStack>
  )
}
