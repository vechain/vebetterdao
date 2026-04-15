"use client"

import { Box, Heading, VStack } from "@chakra-ui/react"

interface ChallengeHubSectionProps {
  title: string
  children: React.ReactNode
}

export const ChallengeHubSection = ({ title, children }: ChallengeHubSectionProps) => {
  return (
    <VStack align="stretch" gap="4" w="full">
      <Heading size="lg">{title}</Heading>
      <Box>{children}</Box>
    </VStack>
  )
}
