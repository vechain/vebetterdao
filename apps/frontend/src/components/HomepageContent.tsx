import { DashboardAllocationRounds } from "@/app/rounds/components/DashboardAllocationRounds"
import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { DashboardSideBar } from "./DashboardSideBar"
import { DashboardXApps } from "./DashboardXApps"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"
import { LowOnVthoCard } from "./Banners"
import { CastYourVoteCard } from "./Banners/CastYourVoteCard"

export const HomePageContent = () => {
  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
      gap={"32px"}
      w="full"
      data-testid="form-proposal-layout">
      <GridItem colSpan={[1, 1, 2]} order={[2, 2, 1]}>
        <VStack flex={4.5} justifyContent="stretch" alignItems={"stretch"} spacing={"32px"} data-testid="homepage">
          <LowOnVthoCard />
          <CastYourVoteCard />
          <SupplyBreakdownCard />
          <DashboardAllocationRounds />
          <DashboardXApps />
        </VStack>
      </GridItem>
      <GridItem colSpan={1} order={[1, 1, 2]}>
        <DashboardSideBar />
      </GridItem>
    </Grid>
  )
}
