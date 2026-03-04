"use client"

import { Card, Text, VStack } from "@chakra-ui/react"

export function AppsAsRelayers() {
  return (
    <Card.Root variant="primary" p={{ base: "4", md: "6" }}>
      <VStack align="start" gap="3">
        <Text textStyle={{ base: "md", md: "lg" }} fontWeight="bold">
          {"Apps as relayers"}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "Auto-share your users\u2019 votes: no need for VOT3 delegation. Your app can act as a relayer, submit votes and claims for users who enabled auto-voting, and earn relayer rewards."
          }
        </Text>
      </VStack>
    </Card.Root>
  )
}
