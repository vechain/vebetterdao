"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect, use } from "react"

const AllocationRoundContent = dynamic(
  () => import("./AllocationRoundContent").then(mod => mod.AllocationRoundContent),
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

export default function Round(props: Readonly<Props>) {
  const params = use(props.params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}`)
  }, [params.roundId])

  return (
    <MotionVStack>
      <AllocationRoundContent roundId={params.roundId} />
    </MotionVStack>
  )
}
