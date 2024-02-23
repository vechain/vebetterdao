"use client"

import { Box, Spinner, Stack, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { Suspense } from "react"

const TvlBreakdownPieChart = dynamic(
  () => import("@/components/TvlBreakdownPieChart").then(mod => mod.TvlBreakdownPieChart),
  { ssr: false },
)
const CirculatingSupplyPieChart = dynamic(
  () => import("@/components/CirculatingSupplyPieChart").then(mod => mod.CirculatingSupplyPieChart),
  { ssr: false },
)
const BalanceCard = dynamic(() => import("@/components/BalanceCard").then(mod => mod.BalanceCard), { ssr: false })
const ClaimNFT = dynamic(() => import("@/components/ClaimNFT").then(mod => mod.ClaimNFT), { ssr: false })

const VoterRewards = dynamic(() => import("@/components/VoterRewards/VoterRewards").then(mod => mod.VoterRewards), {
  ssr: false,
})

const DashboardAllocationRounds = dynamic(
  () => import("./components/DashboardAllocationRounds").then(mod => mod.DashboardAllocationRounds),
  { ssr: false },
)

export default function Home() {
  return (
    <VStack w="full" spacing={12}>
      <Suspense fallback={<Spinner alignSelf={"center"} />}>
        <Stack
          direction={["column-reverse", "column-reverse", "row"]}
          w="full"
          justify="space-between"
          align={["stretch", "stretch", "flex-start"]}
          spacing={18}>
          <VStack flex={4} justifyContent="stretch" alignItems={"stretch"} spacing={4}>
            <DashboardAllocationRounds />

            <Box>
              <CirculatingSupplyPieChart />
            </Box>
            <Box>
              <TvlBreakdownPieChart />
            </Box>
          </VStack>
          <VStack spacing={4} flex={2.5} position={["static", "static", "sticky"]} top={100} right={0}>
            <BalanceCard />
            <VoterRewards />
            <ClaimNFT />
          </VStack>
        </Stack>
      </Suspense>
    </VStack>
  )
}
