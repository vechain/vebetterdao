"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect, use } from "react"

const CastAllocationVotePageContent = dynamic(
  () =>
    import("./components/CastAllocationVotePageContent/CastAllocationVotePageContent").then(
      mod => mod.CastAllocationPageVoteContent,
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

export default function CastAllocationVotePage(props: Readonly<Props>) {
  const params = use(props.params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}/vote`)
  }, [params.roundId])

  return (
    <MotionVStack>
      <CastAllocationVotePageContent roundId={params.roundId} />
    </MotionVStack>
  )
}
