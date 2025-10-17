import { VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAccountAppPermissions } from "../../../../api/contracts/xApps/hooks/useAccountAppPermissions"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"

import { AppBalanceCard } from "./AppBalanceCard/AppBalanceCard"

export const AppDetailsSidebar = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: appPermissions } = useAccountAppPermissions(account?.address ?? "")
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
