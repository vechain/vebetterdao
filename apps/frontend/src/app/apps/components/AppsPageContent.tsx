import { useXApps, useXNode } from "@/api"
import { JoinB3TRAppsBanner } from "@/components"

import { AppsLookingForEndorsement } from "./AppsLookingForEndorsement"
import { AllApps } from "./AllApps"
import { AppCards } from "./AppCards"

import { useMemo } from "react"

import { VStack, Heading, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

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
  const { isXNodeLoading, isEndorsingApp, endorsedApp, xNodePoints, xNodeLevel } = useXNode()
  console.log("xApps in the AppsPageContent Component", xApps)
  const xAppUserEndorsed: XAppInformations | null = useMemo(() => {
    if (!xApps || isXNodeLoading || !endorsedApp || !isEndorsingApp) return null

    return {
      xAppId: endorsedApp.id,
      xNodePoints: xNodePoints,
      xNodeLevel: xNodeLevel,
      isLoading: isXAppsLoading,
    }
  }, [isXNodeLoading, endorsedApp, xApps, xNodePoints])

  // {
  //    TODO: show the appsLookingForEndorsement carrouselle if xNodeHolder && notEndorsingAnyApp on top instead bellow the page
  // }

  //TODO: Pagination, search, filters
  return (
    <VStack alignItems={"flex-start"} position={"relative"} spacing={4}>
      {/* TODO: pass the appBanner in that place (absolute position) */}
      {/* <AppsBanner /> */}

      <VStack alignItems={"flex-start"}>
        <Heading>{t("Your endorsed app")}</Heading>
        <Text>{t("With your XNode, you endorse apps to allow them to participate in governance")}</Text>
        {xAppUserEndorsed ? (
          <AppCards
            xAppId={xAppUserEndorsed.xAppId}
            xNodePoints={xAppUserEndorsed.xNodePoints}
            xNodeLevel={xNodeLevel}
            variant={"endorsedApps"}
          />
        ) : null}
      </VStack>

      <VStack alignItems={"flex-start"}>
        <Heading>{t("All the apps")}</Heading>
        <AllApps xApps={xApps} isXAppsLoading={isXAppsLoading} />
      </VStack>

      <AppsLookingForEndorsement xApps={xApps?.unendorsed} />

      <JoinB3TRAppsBanner />
    </VStack>
  )
}
