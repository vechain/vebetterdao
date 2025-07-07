import { useXNode, useIsCreatorOfAnyApp, useSortXappAlphabetically, useXApps } from "@/api"
import { AppsBanner, JoinB3TRAppsBanner } from "@/components"
import { VStack, Heading, Text, Box, HStack, useMediaQuery } from "@chakra-ui/react"
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
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const { isXNodeLoading, isEndorsingApp, endorsedApp } = useXNode()
  const { data: xAppsNotSorted, isLoading: isXAppsLoading } = useXApps({ filterBlacklisted: true })
  const { data: currentAllocationAppIds, isLoading: isCurrentAllocationAppIdsLoading } = useCurrentAllocationAppIds()
  const appsLoading = isXAppsLoading || isCurrentAllocationAppIdsLoading

  const { data: isCreatorOfAnyApp } = useIsCreatorOfAnyApp(account?.address ?? "")
  const { data: xApps } = useSortXappAlphabetically(xAppsNotSorted)

  // New apps looking for endorsement slider
  const newApps = xApps?.newLookingForEndorsement ?? []
  const hasNewApps = newApps.length > 0

  // New apps list for the AllApps component
  // Note: unendorsed app are always considered new until they are endorsed : timestamp = 0 untill then
  const newAppsEndorsedandUnendorsed = [...(xApps?.newApps ?? []), ...newApps]

  // Apps tabs
  const currentActiveApps =
    xApps?.active.filter(app => currentAllocationAppIds?.includes(app.id as unknown as `0x${string}`)) ?? []
  const gracePeriodApps = xApps?.gracePeriod ?? []
  const endorsementLostApps = xApps?.endorsementLost ?? []

  const gracePeriodIds = new Set(gracePeriodApps.map(app => app.id))
  const activeAppsWithoutGracePeriod = currentActiveApps.filter(app => !gracePeriodIds.has(app.id))

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

      {!isAbove800 ? (
        <VStack alignItems={"flex-start"} spacing={4} w="full">
          <Heading size="lg">{t("Sustainability apps")}</Heading>
          <AllApps
            newApps={newAppsEndorsedandUnendorsed}
            currentActiveApps={activeAppsWithoutGracePeriod}
            gracePeriodApps={gracePeriodApps}
            endorsementLostApps={endorsementLostApps}
            isXAppsLoading={appsLoading}
          />
        </VStack>
      ) : (
        <HStack w="full" alignItems={"flex-start"} spacing={0}>
          <AllApps
            headingComponent={<Heading size="lg">{t("Sustainability apps")}</Heading>}
            newApps={newAppsEndorsedandUnendorsed}
            currentActiveApps={activeAppsWithoutGracePeriod}
            gracePeriodApps={gracePeriodApps}
            endorsementLostApps={endorsementLostApps}
            isXAppsLoading={appsLoading}
          />
        </HStack>
      )}

      {!isCreatorOfAnyApp && <JoinB3TRAppsBanner />}

      <Box mt={10}>
        <AppsDisclaimer />
      </Box>
    </VStack>
  )
}
