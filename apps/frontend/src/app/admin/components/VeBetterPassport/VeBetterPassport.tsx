import { useAccountPermissions } from "@/api/contracts/account"
import { Grid } from "@chakra-ui/react"
import React from "react"
import { PassportToggles, ParticipationScoreThreshold, RegisterUserAction, AppSecurity } from "./components"
import { useWallet } from "@vechain/dapp-kit-react"

export const VeBetterPassport: React.FC = () => {
  const { account } = useWallet()
  const { isPassportSettingsManager, isPassportActionRegistrar, isPassportScoreManager } = useAccountPermissions(
    account ?? "",
  )

  return (
    <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
      {isPassportSettingsManager && <PassportToggles />}
      {isPassportActionRegistrar && <RegisterUserAction />}
      {isPassportScoreManager && <ParticipationScoreThreshold />}
      {isPassportScoreManager && <AppSecurity />}
    </Grid>
  )
}
