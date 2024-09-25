import { useAppEndorsementStatus, useAppExists, useIsAppAdmin, useIsAppModerator } from "@/api"
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
import { EndorsementStatus } from "@/types"

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

  const isGovernanceUser = useMemo(() => {
    return !isAppModerator && !isAppAdmin
  }, [isAppModerator, isAppAdmin])

  const shouldRenderBalance = useMemo(() => {
    return appHasBeenIntoAllocationRounds
  }, [appHasBeenIntoAllocationRounds])

  const getTemplateAreas = (
    hasAllocationRounds: boolean = false,
    isGovernanceUser: boolean,
    status: EndorsementStatus,
  ) => {
    if (isGovernanceUser) {
      if (status === EndorsementStatus.SUCCESS) {
        return {
          base: `"main-content" "endorsement-card"`,
          lg: hasAllocationRounds
            ? `"main-content side-content" "main-content endorsement-card"`
            : `"main-content endorsement-card" "main-content endorsement-card"`,
        }
      }
      return {
        base: `"endorsement-card" "main-content"`,
        lg: hasAllocationRounds
          ? `"endorsement-card side-content" "main-content side-content"`
          : `"endorsement-card endorsement-card" "main-content main-content"`,
      }
    }

    if (status === EndorsementStatus.LOST) {
      return {
        base: `"main-content" "endorsement-card"`,
        lg: hasAllocationRounds
          ? `"endorsement-card side-content" "main-content side-content"`
          : `"endorsement-card endorsement-card" "main-content endorsement-card"`,
      }
    }

    return {
      base: `"main-content" "endorsement-card"`,
      lg: hasAllocationRounds
        ? `"main-content side-content" "main-content endorsement-card"`
        : `"main-content endorsement-card" "main-content endorsement-card"`,
    }
  }

  const templateAreas = getTemplateAreas(appHasBeenIntoAllocationRounds, isGovernanceUser, endorsementStatus)

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview
        endorsementStatus={endorsementStatus}
        endorsementThreshold={endorsementThreshold}
        isEndorsementStatusLoading={isEndorsementStatusLoading}
      />
      <Grid
        templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
        gap={8}
        templateAreas={{
          base: templateAreas.base,
          lg: templateAreas.lg,
        }}>
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
          <AppEndorsementInfoCard
            endorsementScore={endorsementScore}
            endorsementStatus={endorsementStatus}
            endorsementThreshold={endorsementThreshold}
            isEndorsementStatusLoading={isEndorsementStatusLoading}
          />
        </GridItem>
      </Grid>
    </VStack>
  )
}
