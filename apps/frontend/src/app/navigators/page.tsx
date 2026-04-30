"use client"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../components/MotionVStack"
import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"

import { NavigatorsPageSkeleton } from "./components/NavigatorsPageSkeleton"

const NavigatorsPageContent = dynamic(
  () => import("./components/NavigatorsPageContent").then(mod => mod.NavigatorsPageContent),
  {
    ssr: false,
    loading: () => <NavigatorsPageSkeleton />,
  },
)

export default function NavigatorsPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Navigators")
  }, [])
  return (
    <MotionVStack>
      <NavigatorsPageContent />
    </MotionVStack>
  )
}
