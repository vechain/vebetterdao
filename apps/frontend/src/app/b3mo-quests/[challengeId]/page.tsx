"use client"

import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import { useEffect } from "react"

import { MotionVStack } from "@/components/MotionVStack"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { ChallengeDetailSkeleton } from "./components/ChallengeDetailSkeleton"

const ChallengeDetailPageContent = dynamic(
  () => import("./components/ChallengeDetailPageContent").then(mod => mod.ChallengeDetailPageContent),
  {
    ssr: false,
    loading: () => <ChallengeDetailSkeleton />,
  },
)

export default function ChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>()

  useEffect(() => {
    AnalyticsUtils.trackPage("Challenge Detail")
  }, [])

  return (
    <MotionVStack>
      <ChallengeDetailPageContent challengeId={challengeId} />
    </MotionVStack>
  )
}
