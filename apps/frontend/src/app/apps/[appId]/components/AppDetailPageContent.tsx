import { Grid, GridItem, Stack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"

import { useAppEndorsementStatus } from "../../../../api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useIsAppAdmin } from "../../../../api/contracts/xApps/hooks/useIsAppAdmin"
import { useIsAppModerator } from "../../../../api/contracts/xApps/hooks/useIsAppModerator"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"

import { AppBalanceCard } from "./AppBalanceCard/AppBalanceCard"
import { AppCreationSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview/AppDetailOverview"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"
import { AppScreenshots } from "./AppScreenshots"
import { AppTweets } from "./AppTweets/AppTweets"

export const AppDetailPageContent = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account?.address ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account?.address ?? "")
  const {
    score: endorsementScore,
    status: endorsementStatus,
    threshold: endorsementThreshold,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(app?.id ?? "")
  const isTeamWalletAddress = compareAddresses(app?.teamWalletAddress, account?.address)
  const appHasBeenIntoAllocationRounds = app?.createdAtTimestamp !== "0"
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
        <AppDetailOverview
          endorsementStatus={endorsementStatus}
          isEndorsementStatusLoading={isEndorsementStatusLoading}
        />
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
            endorsementScore={endorsementScore}
            endorsementStatus={endorsementStatus}
            endorsementThreshold={endorsementThreshold}
            isEndorsementStatusLoading={isEndorsementStatusLoading}
          />
        </Stack>
      </GridItem>
    </Grid>
  )
}
