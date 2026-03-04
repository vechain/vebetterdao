"use client"

import { Heading, SimpleGrid, Tabs, VStack } from "@chakra-ui/react"

import { AppsAsRelayers } from "@/components/AppsAsRelayers"
import { BecomeRelayer } from "@/components/BecomeRelayer"
import { ConnectedWallet } from "@/components/ConnectedWallet"
import { RoundsList } from "@/components/RoundsList"
import { StatsCards } from "@/components/StatsCards"

export default function DashboardContent() {
  return (
    <VStack w="full" gap={{ base: 4, md: 6 }} align="stretch">
      <Heading size={{ base: "xl", md: "2xl" }}>{"Auto-Voting & Relayers"}</Heading>

      <Tabs.Root variant="line" size="md" defaultValue="home" colorPalette="blue">
        <Tabs.List>
          <Tabs.Trigger value="home">{"Home"}</Tabs.Trigger>
          <Tabs.Trigger value="relayers">{"My Relayer"}</Tabs.Trigger>
          <Tabs.Trigger value="info">{"Info"}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="home">
          <VStack w="full" gap={{ base: 4, md: 6 }} align="stretch" pt="4">
            <StatsCards />
            <RoundsList />
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              <BecomeRelayer />
              <AppsAsRelayers />
            </SimpleGrid>
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="relayers">
          <VStack w="full" gap={{ base: 4, md: 6 }} align="stretch" pt="4">
            <ConnectedWallet />
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="info">
          <VStack w="full" gap={{ base: 4, md: 6 }} align="stretch" pt="4">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              <BecomeRelayer />
              <AppsAsRelayers />
            </SimpleGrid>
          </VStack>
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}
