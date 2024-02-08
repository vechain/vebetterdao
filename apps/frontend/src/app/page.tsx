"use client"

import { Box, Stack, StackDivider, VStack } from "@chakra-ui/react"
import { BalanceCard, TvlBreakdownPieChart, CirculatingSupplyPieChart, AllocationRoundsList } from "@/components"

export default function Home() {
  return (
    <VStack w="full" spacing={12}>
      <BalanceCard />
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        spacing={18}>
        <VStack flex={4} justifyContent="stretch" alignItems={"stretch"} divider={<StackDivider />} spacing={4}>
          <Box>
            <CirculatingSupplyPieChart />
          </Box>
          <Box>
            <TvlBreakdownPieChart />
          </Box>
        </VStack>
        <VStack spacing={4} flex={2.5} position={["static", "static", "sticky"]} top={100} right={0}>
          <AllocationRoundsList maxRounds={3} />
        </VStack>
      </Stack>
    </VStack>
  )
}
