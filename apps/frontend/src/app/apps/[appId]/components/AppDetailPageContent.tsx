import { useAppEndorsementStatus, useAppExists, useIsAppAdmin, useIsAppModerator } from "@/api"
import { Grid, GridItem, Stack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { AppCreationSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppScreenshots } from "./AppScreenshots"
import { AppTweets } from "./AppTweets"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"
import { AppBalanceCard } from "./AppBalanceCard"
import { XAppStatus } from "@/types"

export const AppDetailPageContent = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")
  const { data: appHasBeenIntoAllocationRounds } = useAppExists(app?.id ?? "")
  const {
    score: endorsementScore,
    status: endorsementStatus,
    threshold: endorsementThreshold,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(app?.id ?? "")

  const shouldRenderCreationSteps = useMemo(() => {
    return !appHasBeenIntoAllocationRounds && (isAppModerator || isAppAdmin)
  }, [appHasBeenIntoAllocationRounds, isAppModerator, isAppAdmin])

  const shouldRenderBalance = useMemo(() => {
    return appHasBeenIntoAllocationRounds
  }, [appHasBeenIntoAllocationRounds])

  const shouldBeLargeEndorsementBox = useMemo(() => {
    if (endorsementStatus === XAppStatus.LOOKING_FOR_ENDORSEMENT) return true
    return false
  }, [endorsementStatus])

  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
      gap={"32px"}
      w="full"
      maxW="full"
      alignItems={"flex-start"}
      data-testid="app-detail-grid">
      <GridItem w="full" colSpan={[1, 1, 3]}>
        <AppDetailOverview
          endorsementStatus={endorsementStatus}
          isEndorsementStatusLoading={isEndorsementStatusLoading}
        />
      </GridItem>
      <GridItem w="full" colSpan={[1, 1, 2]} order={[2, 2, 1]}>
        <Stack direction="column" spacing={8}>
          {shouldRenderCreationSteps ? <AppCreationSteps /> : null}
          {shouldBeLargeEndorsementBox && (
            <AppEndorsementInfoCard
              endorsementScore={endorsementScore}
              endorsementStatus={endorsementStatus}
              endorsementThreshold={endorsementThreshold}
              isEndorsementStatusLoading={isEndorsementStatusLoading}
              isLargeCard
            />
          )}
          <AppScreenshots />
          <AppTweets />
        </Stack>
      </GridItem>

      <GridItem w="full" colSpan={1} order={[1, 1, 2]}>
        <Stack direction="column" spacing={8}>
          {shouldRenderBalance && <AppBalanceCard />}
          {!shouldBeLargeEndorsementBox && (
            <AppEndorsementInfoCard
              endorsementScore={endorsementScore}
              endorsementStatus={endorsementStatus}
              endorsementThreshold={endorsementThreshold}
              isEndorsementStatusLoading={isEndorsementStatusLoading}
            />
          )}
        </Stack>
      </GridItem>
    </Grid>
  )
}
