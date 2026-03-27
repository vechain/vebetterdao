import { Box, Grid, GridItem, Stack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAppEndorsementStatus } from "../../../../api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useMaxPointsPerApp } from "../../../../api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useIsAppAdmin } from "../../../../api/contracts/xApps/hooks/useIsAppAdmin"
import { useIsAppModerator } from "../../../../api/contracts/xApps/hooks/useIsAppModerator"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"

import { AppBalanceCard } from "./AppBalanceCard/AppBalanceCard"
import { AppCreationSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview/AppDetailOverview"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"
import { AppRewardStatsCard } from "./AppRewardStatsCard"
import { AppScreenshots } from "./AppScreenshots"
import { ProofValidationAlert } from "./ProofValidationAlert/ProofValidationAlert"

export const AppDetailPageContent = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account?.address ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account?.address ?? "")
  const {
    score: endorsementScore,
    status: endorsementStatus,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(app?.id ?? "")
  const { data: maxPointsPerAppValue } = useMaxPointsPerApp()
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
        <Stack direction="column" gap={4}>
          {(isAppModerator || isAppAdmin) && app?.id && <ProofValidationAlert appId={app.id} />}

          <AppDetailOverview
            endorsementStatus={endorsementStatus}
            isEndorsementStatusLoading={isEndorsementStatusLoading}
          />
          <AppScreenshots />
          <Stack direction={["column", "column", "row"]} gap={4} justifyContent="stretch" w="full" h="full">
            <Box flex={2} minW={0}>
              <AppRewardStatsCard />
            </Box>

            <Box flex={1} minW={0}>
              <AppEndorsementInfoCard
                endorsementScore={endorsementScore}
                endorsementStatus={endorsementStatus}
                endorsementThreshold={maxPointsPerAppValue?.toString()}
                isEndorsementStatusLoading={isEndorsementStatusLoading}
              />
            </Box>
          </Stack>
          {shouldRenderBalance && <AppBalanceCard />}
        </Stack>
      </GridItem>
      <GridItem w="full" colSpan={[1, 1, 2]} order={[2, 2, 1]}>
        <Stack direction="column" gap={8}>
          {shouldRenderCreationSteps ? <AppCreationSteps /> : null}
        </Stack>
      </GridItem>
    </Grid>
  )
}
