"use client"

import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "@/components/MotionVStack"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { ChallengesPageSkeleton } from "./components/ChallengesPageSkeleton"

const ChallengesPageContent = dynamic(
  () => import("./components/ChallengesPageContent").then(mod => mod.ChallengesPageContent),
  {
    ssr: false,
    loading: () => <ChallengesPageSkeleton />,
  },
)

export default function ChallengesPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Challenges")
  }, [])

  return (
    <MotionVStack>
      <ChallengesPageContent />
    </MotionVStack>
  )
}
