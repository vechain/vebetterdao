"use client"
import { useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"

import { AppDetailPageContent } from "./components/AppDetailPageContent"
import { AppDetailServerData } from "./types"

type Props = {
  params: { appId: string }
  appDetailData: AppDetailServerData
}

export const AppDetailPage = ({ params, appDetailData }: Props) => {
  useEffect(() => {
    AnalyticsUtils.trackPage(`App/${params.appId}`)
  }, [params.appId])

  return (
    <MotionVStack>
      <AppDetailPageContent appDetailData={appDetailData} />
    </MotionVStack>
  )
}
