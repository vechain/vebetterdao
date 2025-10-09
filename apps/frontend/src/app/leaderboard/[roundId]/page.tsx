"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

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
type Props = { params: { roundId: string } }
export default function LeaderboardPage({ params }: Props) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`Leaderboard/${params.roundId}`)
  }, [params.roundId])
  return (
    <MotionVStack>
      <LeaderboardPageContent roundId={params.roundId} />
    </MotionVStack>
  )
}
