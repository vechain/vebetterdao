import { useAccountPermissions } from "@/api/contracts/account"
import { Grid } from "@chakra-ui/react"
import React from "react"
import {
  PassportToggles,
  ParticipationScoreThreshold,
  RegisterUserAction,
  AppSecurity,
  ManageUserStatus,
  ManageUserSignals,
} from "./components"
import { useWallet } from "@vechain/dapp-kit-react"

export const VeBetterPassport: React.FC = () => {
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account ?? "")

  return (
    <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
      {permissions?.isPassportSettingsManager && <PassportToggles />}
      {permissions?.isPassportActionRegistrar && <RegisterUserAction />}
      {permissions?.isPassportScoreManager && <ParticipationScoreThreshold />}
      {permissions?.isPassportScoreManager && <AppSecurity />}
      {permissions?.isPassportWhitelister && <ManageUserStatus />}
      {permissions?.isPassportBotSignaler && <ManageUserSignals />}
    </Grid>
  )
}
