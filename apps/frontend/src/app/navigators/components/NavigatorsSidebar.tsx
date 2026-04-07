import { VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"

import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"

import { NavigatorInfoCard } from "./NavigatorInfoCard"
import { NavigatorMyStatusCard } from "./NavigatorMyStatusCard"

export const NavigatorsSidebar = () => {
  const { account } = useWallet()
  const { data: isNavigator } = useIsNavigator()

  return (
    <VStack gap={4} align="stretch" w="full">
      {account?.address && isNavigator && <NavigatorMyStatusCard />}
      <NavigatorInfoCard />
    </VStack>
  )
}
