import { VStack, Heading, Box, HStack, useMediaQuery, Card } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useCurrentAllocationAppIds } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationAppIds"

import { useNodesEndorsedApps } from "../../../api/contracts/xApps/hooks/endorsement/useUserNodesEndorsement"
import { useIsCreatorOfAnyApp } from "../../../api/contracts/xApps/hooks/useIsCreatorOfAnyApp"
import { useSortXappAlphabetically } from "../../../api/contracts/xApps/hooks/useSortXappAlphabetically"
import { useXApps } from "../../../api/contracts/xApps/hooks/useXApps"
import { useGetUserNodes, UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { AppsBanner } from "../../../components/Banners/AppsBanner"
import { JoinB3TRAppsBanner } from "../../../components/Banners/JoinB3TRAppsBanner"

import { AllApps } from "./allApps/AllApps"
import { AppsDisclaimer } from "./AppsDisclaimer"
import { AppsLookingForEndorsement } from "./AppsLookingForEndorsement"
import { EndorsementPointsBanner } from "./EndorsementPointsBanner"

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
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: endorsedApps, isLoading: isEndorsedAppsLoading } = useNodesEndorsedApps(
    userNodesInfo?.nodesManagedByUser?.map((node: UserNode) => node.id.toString()) ?? [],
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
