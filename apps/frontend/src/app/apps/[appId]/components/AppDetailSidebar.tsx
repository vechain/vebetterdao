import { VStack } from "@chakra-ui/react"
import { AppBalanceCard } from "./AppBalanceCard"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { useIsAppAdmin } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

export const AppDetailsSidebar = () => {
  const { account } = useWallet()
  const { app } = useCurrentAppInfo()
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")

  return (
    <VStack spacing={4} flex={2} position="relative">
      {isAppAdmin && <AppBalanceCard />}
    </VStack>
  )
}
