"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect, use } from "react"

const ConfirmCastAllocationVotePageContent = dynamic(
  () =>
    import("./components/ConfirmCastAllocationVotePageContent").then(mod => mod.ConfirmCastAllocationVotePageContent),
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
  params: Promise<{
    roundId: string
  }>
}

export default function CastAllocationVotePage(props: Readonly<Props>) {
  const params = use(props.params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}/vote/confirm`)
  }, [params.roundId])

  return (
    <MotionVStack>
      <ConfirmCastAllocationVotePageContent roundId={params.roundId} />
    </MotionVStack>
  )
}
