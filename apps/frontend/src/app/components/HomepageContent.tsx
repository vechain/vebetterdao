import { DashboardAllocationRounds } from "@/app/rounds/components/DashboardAllocationRounds/DashboardAllocationRounds"
import { Grid, GridItem, Hide, Show, VStack } from "@chakra-ui/react"
import { DashboardSideBar } from "./DashboardSideBar"
import { DashboardXApps } from "./DashboardXApps"
import { RoundInfoBottomSheet } from "./RoundInfoBottomSheet"
import { TokensBalance } from "./TokensBalance"
import { ActionBanner } from "./ActionBanners"
import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { GmNFTAndNodeCard } from "@/components/GmNFTAndNodeCard"

export const HomePageContent = () => {
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
        <GridItem colSpan={[1, 1, 3]} display="grid">
          <ActionBanner />
          <GmNFTAndNodeCard />
        </GridItem>
        <GridItem colSpan={[1, 1, 2]} order={[2, 2, 1]}>
          <VStack justifyContent="stretch" alignItems={"stretch"} spacing={"32px"} data-testid="homepage">
            <Show above="md">
              <TokensBalance showGoToBalance />
              <CantVoteCard />
            </Show>
            <Show above="md">
              <DashboardAllocationRounds />
            </Show>
            <DashboardXApps />
          </VStack>
        </GridItem>
        <GridItem colSpan={1} order={[1, 1, 2]}>
          <DashboardSideBar />
        </GridItem>
      </Grid>
    </>
  )
}
