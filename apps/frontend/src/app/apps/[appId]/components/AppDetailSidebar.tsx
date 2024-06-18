import { VStack } from "@chakra-ui/react"
import { AppBalanceCard } from "./AppBalanceCard"

export const AppDetailsSidebar = () => {
  return (
    <VStack spacing={4} flex={2} position="relative">
      <AppBalanceCard />
    </VStack>
  )
}
