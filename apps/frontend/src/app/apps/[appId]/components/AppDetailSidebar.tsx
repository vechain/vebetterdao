import { VStack } from "@chakra-ui/react"
import { AppBalanceCard } from "./AppBalanceCard"

export const AppDetailsSidebar = () => {
  return (
    <VStack flex={1.5}>
      <AppBalanceCard />
    </VStack>
  )
}
