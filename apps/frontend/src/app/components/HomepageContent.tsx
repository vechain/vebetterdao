import { DashboardAllocationRounds } from "@/app/rounds/components/DashboardAllocationRounds/DashboardAllocationRounds"
import { Grid, GridItem, Hide, HStack, Show, VStack } from "@chakra-ui/react"
import { DashboardSideBar } from "./DashboardSideBar"
import { RoundInfoBottomSheet } from "./RoundInfoBottomSheet"
import { ActionBanner } from "./ActionBanners"
import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { GmNFTAndNodeCard } from "@/components/GmNFTAndNodeCard"
import { useWallet } from "@vechain/vechain-kit"
import { ManagedAppsCard, SupplyBreakdownCard } from "@/components"

export const HomePageContent = () => {
  const { connection } = useWallet()

  return (
    <>
      <Hide above="md">
        <RoundInfoBottomSheet />
      </Hide>
      <Grid
        templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
        gap={"32px"}
        w="full"
        maxW="full"
        alignItems={"flex-start"}
        data-testid="form-proposal-layout">
        {connection.isConnected && (
          <GridItem colSpan={[1, 1, 3]} display="grid">
            <ActionBanner />
          </GridItem>
        )}
        <GridItem colSpan={[1, 1, 3]}>
          <GmNFTAndNodeCard />
        </GridItem>
        <GridItem colSpan={[1, 1, 2]} order={[2, 2, 1]}>
          <VStack justifyContent="stretch" alignItems={"stretch"} spacing={"32px"} data-testid="homepage">
            <Show above="md">
              <CantVoteCard />
            </Show>
            <Show above="md">
              <DashboardAllocationRounds />
            </Show>
            <Show above="md">
              <HStack>
                <ManagedAppsCard />
                <SupplyBreakdownCard />
              </HStack>
            </Show>
          </VStack>
        </GridItem>
        <GridItem colSpan={1} order={[1, 1, 2]}>
          <DashboardSideBar />
        </GridItem>
      </Grid>
    </>
  )
}
