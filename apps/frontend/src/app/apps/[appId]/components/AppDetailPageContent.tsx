import { XAppsCreationSteps } from "@/types"
import { Stack, VStack } from "@chakra-ui/react"
import { AppCreationSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppDetailsSidebar } from "./AppDetailSidebar"
import { AppScreenshots } from "./AppScreenshots"
import { AppTweets } from "./AppTweets"

export const AppDetailPageContent = () => {
  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />
      <Stack w="full" spacing={8} flexDirection={["column", "column", "column", "row"]} align="stretch">
        <Stack direction="column" gap={8} flex={3.5} minW={0} w="full" maxW={"100vw"}>
          <AppCreationSteps currentStep={XAppsCreationSteps.ALLOCATION} />
          <AppScreenshots />
          <AppTweets />
        </Stack>
        <AppDetailsSidebar />
      </Stack>
    </VStack>
  )
}
