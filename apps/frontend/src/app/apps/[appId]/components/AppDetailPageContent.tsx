import { VStack } from "@chakra-ui/react"
import { AppDetailOverview } from "./AppDetailOverview"

export const AppDetailPageContent = () => {
  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />
    </VStack>
  )
}
