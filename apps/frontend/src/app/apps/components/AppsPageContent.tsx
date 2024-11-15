import { useXApps, useXNode } from "@/api"
import { AppsBanner } from "@/components"
import { VStack, Heading, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { AppsLookingForEndorsement } from "./AppsLookingForEndorsement"
import { AllApps } from "./AllApps"
import { EndorsementPointsBanner } from "./EndorsementPointsBanner"
import { UnendorsedAppCard } from "./UnendorsedAppCard"

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
  const { isXNodeLoading, isEndorsingApp, endorsedApp } = useXNode()
  const { data: xApps, isLoading: isXAppsLoading } = useXApps()

  const newApps = xApps?.unendorsed.filter(xApp => xApp.createdAtTimestamp === "0")

  const unendorsedApps = xApps?.unendorsed.filter(xApp => xApp.createdAtTimestamp !== "0")
  const gracePeriodApps = unendorsedApps?.filter(xApp => xApp.appAvailableForAllocationVoting === true)
  const lostEndorsementApps = unendorsedApps?.filter(xApp => xApp.appAvailableForAllocationVoting === false)
  const hasNewApps = newApps && newApps?.length > 0
  // TODO: Pagination, search, filters
  return (
    <VStack alignItems={"flex-start"} position={"relative"} spacing={12} w="full">
      <AppsBanner />

      {!isXNodeLoading && isEndorsingApp ? (
        <VStack alignItems={"flex-start"} spacing={4}>
          <Heading size="lg">{t("Your endorsed app")}</Heading>
          <Text color="#6a6a6a">
            {t("With your Node, you endorse apps to allow them to participate in governance")}
          </Text>
          <UnendorsedAppCard xApp={endorsedApp} />
        </VStack>
      ) : (
        <EndorsementPointsBanner />
      )}
      {hasNewApps ? <AppsLookingForEndorsement filteredApps={newApps} /> : undefined}

      <VStack alignItems={"flex-start"} spacing={4} w="100%">
        <Heading size="lg">{t("All the apps")}</Heading>
        <AllApps
          activeApps={xApps?.active || []}
          gracePeriodApps={gracePeriodApps || []}
          lostEndorsementApps={lostEndorsementApps || []}
          isXAppsLoading={isXAppsLoading}
        />
      </VStack>

      {/* TODO: mascot release <JoinB3TRAppsBanner /> */}
    </VStack>
  )
}
