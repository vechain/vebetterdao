"use client"

import { Badge, Box, Heading, HStack, VStack } from "@chakra-ui/react"

interface ChallengeHubSectionProps {
  title: string
  count: number
  children: React.ReactNode
}

export const ChallengeHubSection = ({ title, count, children }: ChallengeHubSectionProps) => {
  return (
    <VStack align="stretch" gap="4" w="full">
      <HStack justify="space-between">
        <HStack gap="2" align="baseline">
          <Heading size="lg">{title}</Heading>
          <Badge variant="neutral" size="sm">
            {count}
          </Badge>
        </HStack>
      </HStack>
      <Box>{children}</Box>
    </VStack>
  )
}
