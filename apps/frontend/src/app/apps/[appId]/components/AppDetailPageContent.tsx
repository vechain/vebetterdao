import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppScreenshots } from "./AppScreenshots"
import { AppDetailsSidebar } from "./AppDetailSidebar"

export const AppDetailPageContent = () => {
  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />

      <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(6, 1fr)"]} gap={8} w="full">
        <GridItem colSpan={[1, 4]}>
          <AppScreenshots />
        </GridItem>

        <GridItem colSpan={[1, 2]}>
          <AppDetailsSidebar />
        </GridItem>
      </Grid>
    </VStack>
  )
}
