import { useAppExists } from "@/api"
import { Stack } from "@chakra-ui/react"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { AppBalanceCard } from "./AppBalanceCard"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"

export const AppDetailsSidebar = () => {
  const { app } = useCurrentAppInfo()
  // NB: All the commented code below should be enabled later,
  // it is now disabled to work on the different versions of `AppEndorsementInfoCard`
  // const { account } = useWallet()

  // Conditional rendering based on user role
  // const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  // const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")

  // Conditional rendering based on xApp state
  const { data: appHasBeenIntoAllocationRounds } = useAppExists(app?.id ?? "")

  return (
    <Stack spacing={8} direction={"column"} flex={1.5}>
      {appHasBeenIntoAllocationRounds && <AppBalanceCard />}
      <AppEndorsementInfoCard appId={app?.id ?? ""} />
    </Stack>
  )
}
