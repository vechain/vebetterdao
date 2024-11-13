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
  console.log("*****xApps", xApps)

  //TODO: Pagination, search, filters
  return (
    <VStack alignItems={"flex-start"} position={"relative"} spacing={4} w="full">
      <AppsBanner />

      <AppsLookingForEndorsement xApps={xApps?.unendorsed || []} />

      {!isXNodeLoading &&
        (isEndorsingApp ? (
          <>
            <Heading>{t("Your endorsed app")}</Heading>
            <Text>{t("With your XNode, you endorse apps to allow them to participate in governance")}</Text>
            <UnendorsedAppCard xApp={endorsedApp} />
          </>
        ) : (
          <EndorsementPointsBanner />
        ))}

      <VStack alignItems={"flex-start"}>
        <Heading>{t("All the apps")}</Heading>
        <AllApps xApps={xApps?.allApps || []} isXAppsLoading={isXAppsLoading} />
      </VStack>

      {/* TODO: mascot release <JoinB3TRAppsBanner /> */}
    </VStack>
  )
}
