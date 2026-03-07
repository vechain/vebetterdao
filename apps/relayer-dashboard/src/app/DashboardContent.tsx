"use client"

import { Box, SimpleGrid, VStack } from "@chakra-ui/react"

import { AiSkillBanner } from "@/components/AiSkillBanner"
import { AppsAsRelayers } from "@/components/AppsAsRelayers"
import { BecomeRelayer } from "@/components/BecomeRelayer"
import { ConnectedWallet } from "@/components/ConnectedWallet"
import { FeelLostBanner } from "@/components/FeelLostBanner"
import { RoundsChart } from "@/components/RoundsChart"
import { RoundsList } from "@/components/RoundsList"
import { StatsCards } from "@/components/StatsCards"
import { useNavigation } from "@/hooks/useNavigation"

export default function DashboardContent() {
  const { activePage } = useNavigation()

  return (
    <VStack w="full" gap={{ base: 4, md: 14 }} align="stretch">
      {activePage === "home" && (
        <>
          <SimpleGrid w="full" columns={{ base: 1, md: 2, lg: 2 }} gap="4">
            <StatsCards />
            <RoundsChart />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <BecomeRelayer />
            <AppsAsRelayers />
          </SimpleGrid>

          <RoundsList />

          <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
            <FeelLostBanner />
            <Box gridColumn={{ md: "span 2" }}>
              <AiSkillBanner />
            </Box>
          </SimpleGrid>
        </>
      )}

      {activePage === "relayer" && <ConnectedWallet />}

      {activePage === "info" && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <BecomeRelayer />
          <AppsAsRelayers />
        </SimpleGrid>
      )}
    </VStack>
  )
}
