import { useIsAppAdmin, useIsAppModerator, useIsAppUnendorsed } from "@/api"
import { Stack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { AppBalanceCard } from "./AppBalanceCard"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"

export const AppDetailsSidebar = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: isAppUnendorsed } = useIsAppUnendorsed(app?.id ?? "")
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")

  return (
    (isAppModerator || isAppAdmin) && (
      <Stack spacing={8} direction={"column"} flex={1.5}>
        <AppBalanceCard />
        {isAppUnendorsed && <AppEndorsementInfoCard appId={app?.id} />}
      </Stack>
    )
  )
}
