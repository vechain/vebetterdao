"use client"

import { SimpleGrid, VStack } from "@chakra-ui/react"

import { AppsAsRelayers } from "@/components/AppsAsRelayers"
import { BecomeRelayer } from "@/components/BecomeRelayer"
import { ConnectedWallet } from "@/components/ConnectedWallet"
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

          <RoundsList />

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <BecomeRelayer />
            <AppsAsRelayers />
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
