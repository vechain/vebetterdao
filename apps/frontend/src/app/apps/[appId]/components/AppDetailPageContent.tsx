import { HStack, VStack } from "@chakra-ui/react"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppScreenshots } from "./AppScreenshots"
import { AppDetailsSidebar } from "./AppDetailSidebar"
import { AppTweets } from "./AppTweets"

export const AppDetailPageContent = () => {
  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />
      <HStack w="full" spacing={8} flexDirection={["column", "row"]} align={"flex-start"}>
        <VStack align="stretch" gap={8} flex={3.5}>
          <AppScreenshots />
          <AppTweets />
        </VStack>
        <AppDetailsSidebar />
      </HStack>
    </VStack>
  )
}
