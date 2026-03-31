"use client"

import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react"

interface ChallengeHubSectionProps {
  title: string
  count: number
  children: React.ReactNode
}

export const ChallengeHubSection = ({ title, count, children }: ChallengeHubSectionProps) => {
  return (
    <VStack align="stretch" gap="3" w="full">
      <HStack justify="space-between">
        <HStack gap="2" align="baseline">
          <Heading size="lg">{title}</Heading>
          <Text textStyle="sm" color="text.subtle" fontWeight="semibold">
            {count}
          </Text>
        </HStack>
      </HStack>
      <Box>{children}</Box>
    </VStack>
  )
}
