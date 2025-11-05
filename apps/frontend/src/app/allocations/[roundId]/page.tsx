"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
const AllocationRoundContent = dynamic(
  () => import("./AllocationRoundContent").then(mod => mod.AllocationRoundContent),
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
export default function Round({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}`)
  }, [params.roundId])
  return (
    <MotionVStack>
      <AllocationRoundContent roundId={params.roundId} />
    </MotionVStack>
  )
}
