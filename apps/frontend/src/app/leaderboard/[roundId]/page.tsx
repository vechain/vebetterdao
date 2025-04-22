"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect, use } from "react"

const LeaderboardPageContent = dynamic(
  () => import("../LeaderboardPageContent").then(mod => mod.LeaderboardPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

type Props = { params: Promise<{ roundId: string }> }
export default function LeaderboardPage(props: Props) {
  const params = use(props.params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`Leaderboard/${params.roundId}`)
  }, [params.roundId])

  return (
    <MotionVStack>
      <LeaderboardPageContent roundId={params.roundId} />
    </MotionVStack>
  )
}
