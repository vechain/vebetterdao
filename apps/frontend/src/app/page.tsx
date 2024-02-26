"use client"

import { AnalyticsUtils } from "@/utils"
import { Spinner, Stack, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { Suspense, useEffect } from "react"

const DashboardSideBar = dynamic(() => import("@/components/DashboardSideBar").then(mod => mod.DashboardSideBar), {
  ssr: false,
})

const SupplyBreakdownCard = dynamic(
  () => import("@/components/SupplyBreakdownCard").then(mod => mod.SupplyBreakdownCard),
  { ssr: false },
)

const DashboardAllocationRounds = dynamic(
  () => import("./rounds/components/DashboardAllocationRounds").then(mod => mod.DashboardAllocationRounds),
  { ssr: false },
)

const DashboardXApps = dynamic(() => import("@/components/DashboardXApps").then(mod => mod.DashboardXApps), {
  ssr: false,
})

export default function Home() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Home")
  }, [])
  return (
    <VStack w="full" spacing={12}>
      <Suspense fallback={<Spinner alignSelf={"center"} />}>
        <Stack
          direction={["column-reverse", "column-reverse", "row"]}
          w="full"
          justify="space-between"
          align={["stretch", "stretch", "flex-start"]}
          spacing={12}>
          <VStack flex={4} justifyContent="stretch" alignItems={"stretch"} spacing={4}>
            <SupplyBreakdownCard />
            <DashboardAllocationRounds />
            <DashboardXApps />
          </VStack>
          <DashboardSideBar />
        </Stack>
      </Suspense>
    </VStack>
  )
}
