import { VStack, Heading, Text, Box, HStack, useMediaQuery, Card } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useNodesEndorsedApps } from "../../../api/contracts/xApps/hooks/endorsement/useUserNodesEndorsement"
import { useIsCreatorOfAnyApp } from "../../../api/contracts/xApps/hooks/useIsCreatorOfAnyApp"
import { useSortXappAlphabetically } from "../../../api/contracts/xApps/hooks/useSortXappAlphabetically"
import { useXApps } from "../../../api/contracts/xApps/hooks/useXApps"
import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"
import { AppsBanner } from "../../../components/Banners/AppsBanner"
import { JoinB3TRAppsBanner } from "../../../components/Banners/JoinB3TRAppsBanner"

import { AppsDisclaimer } from "./AppsDisclaimer"
import { AppsLookingForEndorsement } from "./AppsLookingForEndorsement"
import { EndorsementPointsBanner } from "./EndorsementPointsBanner"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AllApps } from "./allApps/AllApps"

import { useCurrentAllocationAppIds } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationAppIds"

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
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])
  const { data: nodes, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: endorsedApps, isLoading: isEndorsedAppsLoading } = useNodesEndorsedApps(
    nodes?.allNodes?.map(node => node.nodeId) ?? [],
  )
  const isXNodeLoading = isUserNodesLoading || isEndorsedAppsLoading
  const isEndorsingApp = !!endorsedApps?.length && endorsedApps?.length > 0
  const { data: xAppsNotSorted, isLoading: isXAppsLoading } = useXApps({ filterBlacklisted: true })
  const { data: currentAllocationAppIds, isLoading: isCurrentAllocationAppIdsLoading } = useCurrentAllocationAppIds()
  const appsLoading = isXAppsLoading || isCurrentAllocationAppIdsLoading
  const { data: isCreatorOfAnyApp } = useIsCreatorOfAnyApp(account?.address ?? "")
  const { data: xApps } = useSortXappAlphabetically(xAppsNotSorted)
  // New apps looking for endorsement
  const newLookingForEndorsementApps = xApps?.newLookingForEndorsement ?? []
  const hasLookingForEndorsementApps = newLookingForEndorsementApps.length > 0

  // New apps that has reached endorsement score but not yet active in allocations
  const newlyEndorsedApps = xApps?.active.filter(app => app.isNew) ?? []
  // New apps looking for endorsement slider
  const newApps = [...newLookingForEndorsementApps, ...newlyEndorsedApps]

  // Apps tabs
  const currentActiveApps =
    xApps?.active.filter(app => currentAllocationAppIds?.includes(app.id as unknown as `0x${string}`)) ?? []
  const gracePeriodApps = xApps?.gracePeriod ?? []
  const endorsementLostApps = xApps?.endorsementLost ?? []

  const gracePeriodIds = new Set(gracePeriodApps.map(app => app.id))
  const activeAppsWithoutGracePeriod = currentActiveApps.filter(app => !gracePeriodIds.has(app.id))

  return (
    <VStack alignItems={"flex-start"} position={"relative"} gap={8} w="full">
      <AppsBanner />

      {!isXNodeLoading && isEndorsingApp && (
        <Card.Root variant="primary" gap="4">
          <VStack alignItems={"flex-start"}>
            <Heading size="2xl">{t("Your endorsed apps")}</Heading>
            <Text color="text.subtle">
              {t("With your Node, you endorse apps to allow them to participate in governance")}
            </Text>
          </VStack>
          <VStack gap={4} alignItems="stretch">
            {endorsedApps?.map(endorsedApp => (
              <UnendorsedAppCard
                key={endorsedApp.endorsedApp.id}
                appId={endorsedApp.endorsedApp.id}
                isNewApp={endorsedApp.endorsedApp.isNew}
                layout="endorser"
              />
            ))}
          </VStack>
        </Card.Root>
      )}

      {hasLookingForEndorsementApps && <AppsLookingForEndorsement filteredApps={newLookingForEndorsementApps} />}

      {!isXNodeLoading && !isEndorsingApp && <EndorsementPointsBanner />}

      <Card.Root variant="primary" w="full">
        {!isAbove800 ? (
          <VStack alignItems={"flex-start"} gap={4} w="full">
            <Heading size={{ base: "xl", md: "2xl" }}>{t("Sustainability apps")}</Heading>
            <AllApps
              newApps={newApps}
              currentActiveApps={activeAppsWithoutGracePeriod}
              gracePeriodApps={gracePeriodApps}
              endorsementLostApps={endorsementLostApps}
              isXAppsLoading={appsLoading}
            />
          </VStack>
        ) : (
          <HStack w="full" alignItems={"flex-start"} gap={0}>
            <AllApps
              headingComponent={<Heading size={{ base: "xl", md: "2xl" }}>{t("Sustainability apps")}</Heading>}
              newApps={newApps}
              currentActiveApps={activeAppsWithoutGracePeriod}
              gracePeriodApps={gracePeriodApps}
              endorsementLostApps={endorsementLostApps}
              isXAppsLoading={appsLoading}
            />
          </HStack>
        )}
      </Card.Root>

      {!isCreatorOfAnyApp && <JoinB3TRAppsBanner />}

      <Box mt={10}>
        <AppsDisclaimer />
      </Box>
    </VStack>
  )
}
