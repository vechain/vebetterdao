import { Grid, GridItem, VStack, useMediaQuery } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"

import { AllocationLayoutHeader } from "../allocations/components/AllocationLayoutHeader"
import { DashboardAllocationRounds } from "../proposals/components/components/DashboardAllocationRounds"

import { ActionBanner } from "./ActionBanners/ActionBanner"
import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { DashboardSideBar } from "./DashboardSideBar"
import { RoundInfoBottomSheet } from "./RoundInfoBottomSheet"

export const HomePageContent = () => {
  const [isAboveMd] = useMediaQuery(["(min-width: 768px)"])

  const { account } = useWallet()

  return (
    <>
      {!isAboveMd && <RoundInfoBottomSheet />}
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
        <GridItem colSpan={[1, 1, 3]} hidden={!account?.address}>
          <AllocationLayoutHeader />
        </GridItem>
        <GridItem colSpan={[1, 1, 2]} order={[2, 2, 1]}>
          <VStack justifyContent="stretch" alignItems={"stretch"} gap={"32px"} data-testid="homepage">
            {isAboveMd && (
              <>
                <CantVoteCard />
                <DashboardAllocationRounds />
              </>
            )}
          </VStack>
        </GridItem>
        <GridItem colSpan={1} order={[1, 1, 2]}>
          <DashboardSideBar />
        </GridItem>
      </Grid>
    </>
  )
}
