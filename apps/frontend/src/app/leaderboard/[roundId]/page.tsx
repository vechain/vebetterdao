"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { use, useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
const LeaderboardPageContent = dynamic(
  () => import("../LeaderboardPageContent").then(mod => mod.LeaderboardPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
type Props = { params: Promise<{ roundId: string }> }
export default function LeaderboardPage({ params }: Props) {
  const { roundId } = use(params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`Leaderboard/${roundId}`)
  }, [roundId])
  return (
    <MotionVStack>
      <LeaderboardPageContent roundId={roundId} />
    </MotionVStack>
  )
}
