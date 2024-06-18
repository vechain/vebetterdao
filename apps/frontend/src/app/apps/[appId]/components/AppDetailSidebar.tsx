import { VStack } from "@chakra-ui/react"
import { AppBalanceCard } from "./AppBalanceCard"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { useAppAdmin } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

export const AppDetailsSidebar = () => {
  const { account } = useWallet()
  const { app } = useCurrentAppInfo()
  const { data: appAdmin } = useAppAdmin(app?.id ?? "")

  const isAppAdmin = appAdmin?.toUpperCase() === account?.toUpperCase()

  return (
    <VStack spacing={4} flex={2} position="relative">
      {isAppAdmin && <AppBalanceCard />}
    </VStack>
  )
}
