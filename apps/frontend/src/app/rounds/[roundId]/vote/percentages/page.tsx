"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../../../components/MotionVStack"
const CastAllocationVotePercentagesPageContent = dynamic(
  () =>
    import("./components/CastAllocationVotePercentagesPageContent").then(
      mod => mod.CastAllocationVotePercentagesPageContent,
    ),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
type Props = {
  params: {
    roundId: string
  }
}
export default function CastAllocationVotePercentagesPage({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}/vote/percentages`)
  }, [params.roundId])
  return (
    <MotionVStack>
      <CastAllocationVotePercentagesPageContent roundId={params.roundId} />
    </MotionVStack>
  )
}
