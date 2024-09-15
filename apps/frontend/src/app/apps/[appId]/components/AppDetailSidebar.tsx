import { useAppExists } from "@/api"
import { Stack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { AppBalanceCard } from "./AppBalanceCard"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"

export const AppDetailsSidebar = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()

  // Conditional rendering based on user role
  // const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  // const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")

  // Conditional rendering based on xApp state
  const { data: appExists } = useAppExists(app?.id ?? "")

  return (
    <Stack spacing={8} direction={"column"} flex={1.5}>
      {appExists && <AppBalanceCard />}
      <AppEndorsementInfoCard appId={app?.id ?? ""} account={account ?? ""} />
    </Stack>
  )
}
