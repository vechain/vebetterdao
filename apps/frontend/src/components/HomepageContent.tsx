import { DashboardAllocationRounds } from "@/app/rounds/components/DashboardAllocationRounds"
import { VStack } from "@chakra-ui/react"
import { DashboardSideBar } from "./DashboardSideBar"
import { DashboardXApps } from "./DashboardXApps"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"
import { LowOnVthoCard } from "./Banners"
import { useBreakpoints } from "@/hooks"

export const HomePageContent = () => {
  const { isMobile } = useBreakpoints()

  return (
    <>
      <VStack flex={4.5} justifyContent="stretch" alignItems={"stretch"} spacing={4} data-testid="homepage">
        <LowOnVthoCard variant={isMobile ? "card" : "banner"} />
        <SupplyBreakdownCard />
        <DashboardAllocationRounds />
        <DashboardXApps />
      </VStack>
      <DashboardSideBar />
    </>
  )
}
