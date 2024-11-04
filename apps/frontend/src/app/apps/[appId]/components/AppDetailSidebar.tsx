import { VStack } from "@chakra-ui/react"
import { AppBalanceCard } from "./AppBalanceCard"
import { useAccountAppPermissions } from "@/api"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"

export const AppDetailsSidebar = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()

  const { data: appPermissions } = useAccountAppPermissions(account ?? "")

  const isAppAdminOrModerator = useMemo(() => {
    if (!appPermissions || !app) return false
    return appPermissions[app.id]?.isAdmin || appPermissions[app.id]?.isModerator
  }, [appPermissions, app])

  return (
    isAppAdminOrModerator && (
      <VStack flex={1.5}>
        <AppBalanceCard />
      </VStack>
    )
  )
}
