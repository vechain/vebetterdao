import { HStack, VStack } from "@chakra-ui/react"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppScreenshots } from "./AppScreenshots"
import { AppDetailsSidebar } from "./AppDetailSidebar"

export const AppDetailPageContent = () => {
  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />

      <HStack w="full" alignItems="stretch" gap={8}>
        <VStack flex={5} justifyContent="stretch" alignItems={"stretch"} spacing={4}>
          <AppScreenshots />
        </VStack>

        <AppDetailsSidebar />
      </HStack>
    </VStack>
  )
}
