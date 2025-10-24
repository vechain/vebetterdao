import { Grid } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import React from "react"

import { useAccountPermissions } from "../../../../api/contracts/account/hooks/useAccountPermissions"

import { AppSecurity } from "./components/AppSecurity"
import { ManageUserSignals } from "./components/ManageUserSignals"
import { ManageUserStatus } from "./components/ManageUserStatus"
import { ParticipationScoreThreshold } from "./components/ParticipationScoreThreshold"
import { PassportToggles } from "./components/PassportToggles"
import { RegisterUserAction } from "./components/RegisterUserAction"

export const VeBetterPassport: React.FC = () => {
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")
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
