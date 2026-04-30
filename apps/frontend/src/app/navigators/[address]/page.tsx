"use client"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "@/components/MotionVStack"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { NavigatorDetailSkeleton } from "./components/NavigatorDetailSkeleton"

const NavigatorDetailContent = dynamic(
  () => import("./components/NavigatorDetailContent").then(mod => mod.NavigatorDetailContent),
  {
    ssr: false,
    loading: () => <NavigatorDetailSkeleton />,
  },
)

export default function NavigatorDetailPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NavigatorDetail")
  }, [])
  return (
    <MotionVStack>
      <NavigatorDetailContent />
    </MotionVStack>
  )
}
