"use client"

import { Card, Link, Text, VStack } from "@chakra-ui/react"

export function BecomeRelayer() {
  return (
    <Card.Root variant="primary" p={{ base: "4", md: "6" }}>
      <VStack align="start" gap="3">
        <Text textStyle={{ base: "md", md: "lg" }} fontWeight="bold">
          {"Become a relayer"}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "Relayers run off-chain services that execute auto-votes and claim rewards on behalf of users who enabled auto-voting. In return, relayers earn fees from the RelayerRewardsPool."
          }
        </Text>
        <Link
          href="https://docs.vebetterdao.org"
          target="_blank"
          rel="noopener noreferrer"
          color="actions.primary.default"
          textStyle="sm"
          fontWeight="semibold">
          {"Documentation and setup guide \u2192"}
        </Link>
      </VStack>
    </Card.Root>
  )
}
