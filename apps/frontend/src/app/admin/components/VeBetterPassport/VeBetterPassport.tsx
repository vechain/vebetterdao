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
  const {
    isPassportSettingsManager,
    isPassportActionRegistrar,
    isPassportScoreManager,
    isPassportWhitelister,
    isPassportBotSignaler,
  } = useAccountPermissions(account ?? "")

  return (
    <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
      {isPassportSettingsManager && <PassportToggles />}
      {isPassportActionRegistrar && <RegisterUserAction />}
      {isPassportScoreManager && <ParticipationScoreThreshold />}
      {isPassportScoreManager && <AppSecurity />}
      {isPassportWhitelister && <ManageUserStatus />}
      {isPassportBotSignaler && <ManageUserSignals />}
    </Grid>
  )
}
