import { VStack } from "@chakra-ui/react"
import { AppBalanceCard } from "./AppBalanceCard"
import { useIsAppAdmin, useIsAppModerator } from "@/api"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { useWallet } from "@vechain/dapp-kit-react"

export const AppDetailsSidebar = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")
  return (
    (isAppModerator || isAppAdmin) && (
      <VStack flex={1.5}>
        <AppBalanceCard />
      </VStack>
    )
  )
}
