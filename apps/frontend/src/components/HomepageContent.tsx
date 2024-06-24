import { DashboardAllocationRounds } from "@/app/rounds/components/DashboardAllocationRounds"
import { Show, VStack } from "@chakra-ui/react"
import { DashboardSideBar } from "./DashboardSideBar"
import { DashboardXApps } from "./DashboardXApps"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"
import { MainnetTimer } from "./MainnetTimer"

export const HomePageContent = () => {
  return (
    <>
      <VStack flex={4.5} justifyContent="stretch" alignItems={"stretch"} spacing={4} data-testid="homepage">
        <Show above="sm">
          <MainnetTimer />
        </Show>
        <SupplyBreakdownCard />
        <DashboardAllocationRounds />
        <DashboardXApps />
      </VStack>
      <DashboardSideBar />
      <Show below="sm">
        <MainnetTimer />
      </Show>
    </>
  )
}
