"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../components/MotionVStack"
const AllocationRoundsContent = dynamic(
  () => import("./components/AllocationRoundsContent").then(mod => mod.AllocationRoundsContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
export default function AllocationsRoundPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Rounds")
  }, [])
  return (
    <MotionVStack>
      <AllocationRoundsContent />
    </MotionVStack>
  )
}
