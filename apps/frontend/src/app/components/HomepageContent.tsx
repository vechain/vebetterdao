import { DashboardAllocationRounds } from "@/app/rounds/components/DashboardAllocationRounds/DashboardAllocationRounds"
import { Grid, GridItem, Show, useMediaQuery, VStack } from "@chakra-ui/react"
import { DashboardSideBar } from "./DashboardSideBar"
import { DashboardXApps } from "./DashboardXApps"
import { RoundInfoBottomSheet } from "./RoundInfoBottomSheet"
import { ActionBanner } from "./ActionBanners"
import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { GmNFTAndNodeCard } from "@/components/GmNFTAndNodeCard"

export const HomePageContent = () => {
  const [isAboveMd] = useMediaQuery(["(min-width: 768px)"])
  return (
    <>
      <Show when={!isAboveMd}>
        <RoundInfoBottomSheet />
      </Show>
      <Grid
        templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
        gap={"32px"}
        w="full"
        maxW="full"
        alignItems={"flex-start"}
        data-testid="form-proposal-layout">
        <GridItem colSpan={[1, 1, 3]} display="grid">
          <ActionBanner />
        </GridItem>
        <GridItem colSpan={[1, 1, 3]}>
          <GmNFTAndNodeCard />
        </GridItem>
        <GridItem colSpan={[1, 1, 2]} order={[2, 2, 1]}>
          <VStack justifyContent="stretch" alignItems={"stretch"} gap={"32px"} data-testid="homepage">
            <Show when={isAboveMd}>
              <CantVoteCard />
            </Show>
            <Show when={isAboveMd}>
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
