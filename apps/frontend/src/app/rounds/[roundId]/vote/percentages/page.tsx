"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect, use } from "react"

const CastAllocationVotePercentagesPageContent = dynamic(
  () =>
    import("./components/CastAllocationVotePercentagesPageContent").then(
      mod => mod.CastAllocationVotePercentagesPageContent,
    ),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
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

export default function CastAllocationVotePercentagesPage(props: Readonly<Props>) {
  const params = use(props.params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}/vote/percentages`)
  }, [params.roundId])

  return (
    <MotionVStack>
      <CastAllocationVotePercentagesPageContent roundId={params.roundId} />
    </MotionVStack>
  )
}
