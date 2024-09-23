import { useAppExists, useIsAppAdmin, useIsAppModerator } from "@/api"
import { Grid, GridItem, Stack, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { AppCreationSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppScreenshots } from "./AppScreenshots"
import { AppTweets } from "./AppTweets"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"
import { AppBalanceCard } from "./AppBalanceCard"

export const AppDetailPageContent = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")
  const { data: appHasBeenIntoAllocationRounds } = useAppExists(app?.id ?? "")

  const shouldRenderCreationSteps = useMemo(() => {
    return !appHasBeenIntoAllocationRounds && (isAppModerator || isAppAdmin)
  }, [appHasBeenIntoAllocationRounds, isAppModerator, isAppAdmin])

  const isGovernanceUser = useMemo(() => {
    return !isAppModerator && !isAppAdmin
  }, [isAppModerator, isAppAdmin])

  const shouldRenderBalance = useMemo(() => {
    return appHasBeenIntoAllocationRounds
  }, [appHasBeenIntoAllocationRounds])

  function generateTemplateAreas(hasAllocationRounds?: boolean, isGovernanceUser: boolean = false) {
    let baseLayout = `
      "main-content"
      "endorsement-card"
      ${hasAllocationRounds ? '"side-content"' : ""}
    `
    let lgLayoutWithBalance = `
         "main-content side-content"
         "main-content endorsement-card"
    `
    const lgLayoutWithoutBalance = `
      "main-content endorsement-card"
      "main-content endorsement-card"
    `

    if (isGovernanceUser) {
      baseLayout = `
      "endorsement-card"
      "main-content"
      ${hasAllocationRounds ? '"side-content"' : ""}
    `
      lgLayoutWithBalance = `
       "endorsement-card side-content"
       "main-content     side-content"
     `
    }

    return {
      base: baseLayout,
      lg: hasAllocationRounds ? lgLayoutWithBalance : lgLayoutWithoutBalance,
    }
  }

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />
      <Grid
        templateColumns={{
          base: "1fr",
          lg: "2fr 1fr",
        }}
        gap={8}
        templateAreas={generateTemplateAreas(appHasBeenIntoAllocationRounds, isGovernanceUser)}>
        <GridItem area="main-content" w="full" alignSelf={"stretch"}>
          <Stack direction="column" spacing={8}>
            {shouldRenderCreationSteps ? <AppCreationSteps /> : null}
            <AppScreenshots />
            <AppTweets />
          </Stack>
        </GridItem>

        {shouldRenderBalance ? (
          <GridItem area="side-content" w="full">
            <AppBalanceCard />
          </GridItem>
        ) : null}

        <GridItem area="endorsement-card" w="full">
          <AppEndorsementInfoCard />
        </GridItem>
      </Grid>
    </VStack>
  )
}
