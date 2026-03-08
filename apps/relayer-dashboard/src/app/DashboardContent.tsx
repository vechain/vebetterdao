"use client"

import { Box, Heading, SimpleGrid, VStack } from "@chakra-ui/react"

import { AiSkillBanner } from "@/components/AiSkillBanner"
import { AppsAsRelayers } from "@/components/AppsAsRelayers"
import { BecomeRelayer } from "@/components/BecomeRelayer"
import { FeelLostBanner } from "@/components/FeelLostBanner"
import { RoundsChart } from "@/components/RoundsChart"
import { RoundsList } from "@/components/RoundsList"
import { StatsCards } from "@/components/StatsCards"

export default function DashboardContent() {
  return (
    <VStack w="full" gap={{ base: 10, md: 14 }} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
        <BecomeRelayer />
        <AppsAsRelayers />
      </SimpleGrid>

      <VStack w="full" gap={4} align="stretch">
        <Heading size="lg">{"Overview"}</Heading>

        <SimpleGrid w="full" columns={{ base: 1, md: 2, lg: 2 }} gap="4">
          <StatsCards />
          <RoundsChart />
        </SimpleGrid>
      </VStack>

      <RoundsList />

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
        <FeelLostBanner />
        <Box gridColumn={{ md: "span 2" }}>
          <AiSkillBanner />
        </Box>
      </SimpleGrid>
    </VStack>
  )
}
