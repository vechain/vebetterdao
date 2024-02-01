"use client"

import { Box, Stack, StackDivider, VStack } from "@chakra-ui/react"
import { BalanceCard, TvlBreakdownPieChart, CirculatingSupplyPieChart } from "@/components"

export default function Home() {
  return (
    <VStack spacing={4} divider={<StackDivider />} w="full">
      <Box w="full">
        <BalanceCard />
      </Box>
      <Stack
        w="full"
        direction={["column", "column", "row"]}
        justifyContent="stretch"
        alignItems={"stretch"}
        divider={<StackDivider />}
        spacing={4}>
        <Box w={["100%", "100%", "50%"]}>
          <CirculatingSupplyPieChart />
        </Box>
        <Box w={["100%", "100%", "50%"]}>
          <TvlBreakdownPieChart />
        </Box>
      </Stack>
    </VStack>
  )
}
