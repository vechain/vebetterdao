"use client"
import { Grid, VStack } from "@chakra-ui/react"

import { SupplyBreakdownCard } from "../components/SupplyBreakdownCard"

import { CreateProposalCTA } from "./components/CreateProposalCTA"
import { TreasuryBalanceChart } from "./components/TreasuryBalanceChart"
import { TreasuryOverview } from "./components/TreasuryOverview"
import { TreasuryTransfersList } from "./components/TreasuryTransfersList"

export const TreasuryPageContent = () => {
  return (
    <VStack w="full" gap={8} pb={8} data-testid="treasury-page">
      <TreasuryOverview />

      <Grid templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" }} gap={8} w="full">
        <VStack gap={8} align="stretch">
          <TreasuryBalanceChart />
          <TreasuryTransfersList />
        </VStack>

        <VStack gap={8} align="stretch" position={{ base: "static", lg: "static" }} top={24} alignSelf="start">
          <SupplyBreakdownCard />
          <CreateProposalCTA />
        </VStack>
      </Grid>
    </VStack>
  )
}
