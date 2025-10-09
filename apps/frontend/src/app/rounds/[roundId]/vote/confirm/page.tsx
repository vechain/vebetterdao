"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../../../components/MotionVStack"
const ConfirmCastAllocationVotePageContent = dynamic(
  () =>
    import("./components/ConfirmCastAllocationVotePageContent").then(mod => mod.ConfirmCastAllocationVotePageContent),
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
export default function CastAllocationVotePage({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}/vote/confirm`)
  }, [params.roundId])
  return (
    <MotionVStack>
      <ConfirmCastAllocationVotePageContent roundId={params.roundId} />
    </MotionVStack>
  )
}
