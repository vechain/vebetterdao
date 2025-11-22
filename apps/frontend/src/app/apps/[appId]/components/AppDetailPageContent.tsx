import { Grid, GridItem, Stack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"

import { useIsAppAdmin } from "../../../../api/contracts/xApps/hooks/useIsAppAdmin"
import { useIsAppModerator } from "../../../../api/contracts/xApps/hooks/useIsAppModerator"
import { AppDetailServerData } from "../types"

import { AppBalanceCard } from "./AppBalanceCard/AppBalanceCard"
import { AppCreationSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview/AppDetailOverview"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"
import { AppScreenshots } from "./AppScreenshots"
import { AppTweets } from "./AppTweets/AppTweets"
import { ProofValidationAlert } from "./ProofValidationAlert/ProofValidationAlert"

type Props = {
  appDetailData: AppDetailServerData
}

export const AppDetailPageContent = ({ appDetailData }: Props) => {
  const { account } = useWallet()
  const { data: isAppModerator } = useIsAppModerator(appDetailData.appInfo.id, account?.address ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(appDetailData.appInfo.id, account?.address ?? "")

  const isTeamWalletAddress = compareAddresses(appDetailData.appInfo.teamWalletAddress, account?.address)
  const appHasBeenIntoAllocationRounds = appDetailData.appInfo.createdAtTimestamp !== "0"

  const shouldRenderCreationSteps = useMemo(() => {
    return !appHasBeenIntoAllocationRounds && (isAppModerator || isAppAdmin)
  }, [appHasBeenIntoAllocationRounds, isAppModerator, isAppAdmin])

  const shouldRenderBalance = useMemo(() => {
    return appHasBeenIntoAllocationRounds && (isAppModerator || isAppAdmin || isTeamWalletAddress)
  }, [appHasBeenIntoAllocationRounds, isAppAdmin, isAppModerator, isTeamWalletAddress])
  return (
    <Grid
      templateColumns={["repeat(1, minmax(0, 1fr))", "repeat(1, minmax(0, 1fr))", "repeat(3, minmax(0, 1fr))"]}
      gap={"32px"}
      w="full"
      alignItems={"flex-start"}
      data-testid="app-detail-grid">
      <GridItem w="full" colSpan={[1, 1, 3]}>
        <Stack direction="column" gap={4}>
          {(isAppModerator || isAppAdmin) && appDetailData.appInfo.id && (
            <ProofValidationAlert appId={appDetailData.appInfo.id} />
          )}

          <AppDetailOverview
            endorsementStatus={appDetailData.endorsementData.status}
            isEndorsementStatusLoading={false}
          />
        </Stack>
      </GridItem>
      <GridItem w="full" colSpan={[1, 1, 2]} order={[2, 2, 1]}>
        <Stack direction="column" gap={8}>
          {shouldRenderCreationSteps ? <AppCreationSteps /> : null}
          <AppScreenshots />
          <AppTweets />
        </Stack>
      </GridItem>

      <GridItem w="full" colSpan={1} order={[1, 1, 2]}>
        <Stack direction="column" gap={8}>
          {shouldRenderBalance && <AppBalanceCard />}
          <AppEndorsementInfoCard
            endorsementScore={appDetailData.endorsementData.score}
            endorsementStatus={appDetailData.endorsementData.status}
            endorsementThreshold={appDetailData.endorsementData.threshold}
            isEndorsementStatusLoading={false}
          />
        </Stack>
      </GridItem>
    </Grid>
  )
}
