import { useXApps, useXNode, useHasAlreadySubmittedApp } from "@/api"
import { AppsBanner, JoinB3TRAppsBanner } from "@/components"
import { VStack, Heading, Text, Box } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { AppsLookingForEndorsement } from "./AppsLookingForEndorsement"
import { AllApps } from "./AllApps"
import { EndorsementPointsBanner } from "./EndorsementPointsBanner"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AppsDisclaimer } from "./AppsDisclaimer"
import { useCurrentAllocationAppIds } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationAppIds"
import { useWallet } from "@vechain/vechain-kit"

export type XAppInformations = {
  key?: string
  xAppId?: string | undefined
  xNodePoints?: number
  xNodeLevel?: number
  variant?: string
  status?: string
}

export const AppsPageContent = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { isXNodeLoading, isEndorsingApp, endorsedApp } = useXNode()
  const { data: xApps, isLoading: isXAppsLoading } = useXApps({ filterBlacklisted: true })
  const { data: currentAllocationAppIds, isLoading: isCurrentAllocationAppIdsLoading } = useCurrentAllocationAppIds()
  const appsLoading = isXAppsLoading || isCurrentAllocationAppIdsLoading

  const { data: hasAlreadySubmittedApp } = useHasAlreadySubmittedApp(account?.address ?? "")

  // New apps looking for endorsement slider
  const newApps = xApps?.newLookingForEndorsement ?? []
  const hasNewApps = newApps.length > 0

  // Apps tabs
  const allApps = xApps?.allApps ?? []
  const currentActiveApps = xApps?.active.filter(app => currentAllocationAppIds?.includes(app.id)) ?? []
  const gracePeriodApps = xApps?.gracePeriod ?? []
  const endorsementLostApps = xApps?.endorsementLost ?? []

  // TODO: Pagination, search, filters
  return (
    <VStack alignItems={"flex-start"} position={"relative"} spacing={8} w="full">
      <AppsBanner />

      {!isXNodeLoading && isEndorsingApp && (
        <VStack alignItems={"flex-start"} spacing={4}>
          <Heading size="lg">{t("Your endorsed app")}</Heading>
          <Text color="#6a6a6a">
            {t("With your Node, you endorse apps to allow them to participate in governance")}
          </Text>
          <UnendorsedAppCard xApp={endorsedApp} layout="endorser" />
        </VStack>
      )}

      {hasNewApps && <AppsLookingForEndorsement filteredApps={newApps} />}

      {!isXNodeLoading && !isEndorsingApp && <EndorsementPointsBanner />}

      <VStack alignItems={"flex-start"} spacing={4} w="100%">
        <Heading size="lg">{t("All the apps")}</Heading>
        <AllApps
          allApps={allApps}
          currentActiveApps={currentActiveApps}
          gracePeriodApps={gracePeriodApps}
          endorsementLostApps={endorsementLostApps}
          isXAppsLoading={appsLoading}
        />
      </VStack>

      {/* if has already submitted an app, don't show the banner */}
      {!hasAlreadySubmittedApp && <JoinB3TRAppsBanner />}

      <Box mt={10}>
        <AppsDisclaimer />
      </Box>
    </VStack>
  )
}
