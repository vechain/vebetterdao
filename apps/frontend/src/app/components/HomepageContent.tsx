import { Grid, GridItem, VStack } from "@chakra-ui/react"

import { GmNFTAndNodeCard } from "../../components/GmNFTAndNodeCard/GmNFTAndNodeCard"
import { DashboardAllocationRounds } from "../proposals/components/components/DashboardAllocationRounds"

import { ActionBanner } from "./ActionBanners/ActionBanner"
import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { DashboardSideBar } from "./DashboardSideBar"

export const HomePageContent = () => {
  return (
    <>
      {/* {!isAboveMd && <RoundInfoBottomSheet />} */}
      <Grid
        templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
        gap="32px"
        w="full"
        maxW="full"
        alignItems={"flex-start"}
        data-testid="form-proposal-layout">
        <GridItem colSpan={[1, 1, 3]} overflow={{ base: "hidden", md: "unset" }}>
          <ActionBanner />
        </GridItem>
        <GridItem colSpan={[1, 1, 3]}>
          <GmNFTAndNodeCard />
        </GridItem>
        <GridItem colSpan={[1, 1, 2]} order={[1, 1, 1]}>
          <VStack justifyContent="stretch" alignItems={"stretch"} gap={"32px"} data-testid="homepage">
            {/* {isAboveMd && (
              <> */}
            <CantVoteCard />
            <DashboardAllocationRounds />
            {/* </>
            )} */}
          </VStack>
        </GridItem>
        <GridItem colSpan={1} order={[2, 2, 2]}>
          <DashboardSideBar />
        </GridItem>
      </Grid>
    </>
  )
}
