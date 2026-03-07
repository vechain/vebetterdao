"use client"

import { Card, Text, VStack } from "@chakra-ui/react"

export function AppsAsRelayers() {
  return (
    <Card.Root variant="primary" p={{ base: "4", md: "6" }}>
      <VStack align="start" gap="3">
        <Text textStyle={{ base: "md", md: "lg" }} fontWeight="bold">
          {"Autovoting as a Service"}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "If you're an app on VeBetterDAO, instead of paying for votes directed your way, become a relayer yourself. Your users set you as a preference, you execute their votes (which go to your app), and you earn relayer fees on top. You go from paying for votes to getting paid to handle them."
          }
        </Text>
      </VStack>
    </Card.Root>
  )
}
