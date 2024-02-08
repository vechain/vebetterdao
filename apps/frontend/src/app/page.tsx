"use client"

import { Box, HStack, StackDivider, VStack } from "@chakra-ui/react"
import { BalanceCard, TvlBreakdownPieChart, CirculatingSupplyPieChart, AllocationRoundsList } from "@/components"

export default function Home() {
  return (
    <VStack w="full" spacing={12}>
      <BalanceCard />
      <HStack w="full" justify="space-between" align="flex-start" spacing={18}>
        <VStack flex={4} justifyContent="stretch" alignItems={"stretch"} divider={<StackDivider />} spacing={4}>
          <Box>
            <CirculatingSupplyPieChart />
          </Box>
          <Box>
            <TvlBreakdownPieChart />
          </Box>
        </VStack>
        <VStack spacing={4} flex={2.5} position={"sticky"} top={100} right={0}>
          <AllocationRoundsList maxRounds={3} />
        </VStack>
      </HStack>
    </VStack>
  )
}
