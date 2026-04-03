import { VStack } from "@chakra-ui/react"

import { NavigatorInfoCard } from "./NavigatorInfoCard"
import { NavigatorOverviewCard } from "./NavigatorOverviewCard"

export const NavigatorsSidebar = () => (
  <VStack gap={4} align="stretch" w="full">
    <NavigatorInfoCard />
    <NavigatorOverviewCard />
  </VStack>
)
