import { useXApps, useXNode } from "@/api"
import { JoinB3TRAppsBanner } from "@/components"
import { AppsLookingForEndorsement } from "./AppsLookingForEndorsement"
import { AllApps } from "./AllApps"
import { VStack, Heading, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { EndorsingAppCard } from "@/app/xnode/XNodeContent/components/EndorsingAppCard"
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
  const { data: xApps, isLoading: isXAppsLoading } = useXApps()
  const { isXNodeLoading, isEndorsingApp } = useXNode()

  //TODO: Pagination, search, filters
  return (
    <VStack alignItems={"flex-start"} position={"relative"} spacing={4}>
      {/* TODO: pass the appBanner in that place (absolute position) */}

      <VStack alignItems={"flex-start"}>
        <Heading>{t("Your endorsed app")}</Heading>
        <Text>{t("With your XNode, you endorse apps to allow them to participate in governance")}</Text>
        {!isXNodeLoading && (isEndorsingApp ? <EndorsingAppCard /> : <EndorsementPointsBanner />)}
      </VStack>

      <VStack alignItems={"flex-start"}>
        <Heading>{t("All the apps")}</Heading>
        <AllApps xApps={xApps?.allApps || []} isXAppsLoading={isXAppsLoading} />
      </VStack>

      <AppsLookingForEndorsement xApps={xApps?.unendorsed || []} />

      <JoinB3TRAppsBanner />
    </VStack>
  )
}
